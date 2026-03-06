from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, authentication_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
from core.models import CustomUser
from students.models import Student
from inventory.models import Item, Release, Supply
from accounting.models import Transaction, StudentFee
import traceback
from django.contrib.auth.hashers import make_password
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

@csrf_exempt
@api_view(['POST'])
@authentication_classes([]) # Disable auth to prevent CSRF check on login
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        return Response({
            'success': True,
            'role': user.role,
            'name': user.get_full_name() or user.username
        })
    else:
        return Response({'success': False, 'error': 'Invalid credentials'}, status=400)

@api_view(['POST'])
def logout_api(request):
    logout(request)
    return Response({'success': True})

@api_view(['GET'])
def dashboard_api(request):
    try:
        user = request.user
        if not user.is_authenticated:
            print(f"DEBUG: User not authenticated: {user}")
            return Response({'error': 'Not Authenticated'}, status=403)

        print(f"DEBUG: User authenticated as {user.username} ({user.role})")
        data = {
            'role': user.role,
            'name': user.get_full_name() or user.username
        }

        if user.is_superuser or user.role in [CustomUser.Role.CHAIRMAN, CustomUser.Role.SUPER_ADMIN]:
            total_revenue = Transaction.objects.aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0
            supplies = Supply.objects.all()
            total_expenditure = sum(s.quantity_supplied * s.unit_cost for s in supplies)
            recent = Transaction.objects.order_by('-date_paid')[:5]
            
            data.update({
                'section': 'CHAIRMAN',
                'stats': [
                    {'label': 'Total Revenue', 'value': total_revenue, 'type': 'currency', 'color': 'text-green-600', 'bg': 'bg-green-100', 'icon': 'TrendingUp'},
                    {'label': 'Total Expenditure', 'value': total_expenditure, 'type': 'currency', 'color': 'text-red-600', 'bg': 'bg-red-100',  'icon': 'TrendingDown'},
                    {'label': 'Net Income', 'value': total_revenue - total_expenditure, 'type': 'currency', 'color': 'text-navy', 'bg': 'bg-blue-100', 'icon': 'NairaSymbol'},
                ],
                'recent_transactions': [{'student': t.student.admission_number, 'amount': t.amount_paid, 'date': t.date_paid} for t in recent]
            })

        elif user.role == CustomUser.Role.PRINCIPAL:
            total_students = Student.objects.count()
            low_stock = Item.objects.filter(stock_remaining__gt=0, stock_remaining__lte=10)
            
            data.update({
                'section': 'PRINCIPAL',
                'stats': [
                    {'label': 'Total Students', 'value': total_students, 'type': 'number', 'color': 'text-navy', 'bg': 'bg-blue-100', 'icon': 'Users'},
                    {'label': 'Low Stock Items', 'value': low_stock.count(), 'type': 'alert', 'color': 'text-red-600', 'bg': 'bg-red-100', 'icon': 'AlertTriangle'},
                ],
                'alerts': [{'item': i.name, 'stock': i.stock_remaining} for i in low_stock]
            })
            
        elif user.role in [CustomUser.Role.ACCOUNT_OFFICER, CustomUser.Role.CASHIER]:
            outstanding = StudentFee.objects.filter(is_fully_paid=False).aggregate(
                 debt=Sum('total_amount_payable') - Sum('amount_paid')
            )['debt'] or 0
            
            data.update({
                'section': 'ACCOUNTS',
                'stats': [
                    {'label': 'Outstanding Debt', 'value': outstanding, 'type': 'currency', 'color': 'text-orange', 'bg': 'bg-orange-100', 'icon': 'AlertTriangle'}
                ]
            })

        elif user.role == CustomUser.Role.TEACHER:
            from academics.models import SubjectAllocation
            allocations = SubjectAllocation.objects.filter(teacher=user)
            class_grades = allocations.values_list('class_grade', flat=True).distinct()
            total_students = Student.objects.filter(
                class_grade__in=class_grades
            ).exclude(student_status__in=['GRADUATED', 'WITHDRAWN', 'TRANSFERRED']).count()
            data.update({
                'section': 'TEACHER',
                'stats': [
                    {'label': 'Subjects Taught', 'value': allocations.count(), 'type': 'number', 'color': 'text-navy', 'bg': 'bg-blue-100', 'icon': 'Users'},
                    {'label': 'Classes', 'value': class_grades.count(), 'type': 'number', 'color': 'text-green-600', 'bg': 'bg-green-100', 'icon': 'TrendingUp'},
                    {'label': 'My Students', 'value': total_students, 'type': 'number', 'color': 'text-orange', 'bg': 'bg-orange-100', 'icon': 'AlertTriangle'},
                ],
                'teacher_classes': list(class_grades),
                'message': f'You teach {allocations.count()} subject(s) across {class_grades.count()} class(es).'
            })

        return Response(data)

    except Exception as e:
        print("ERROR in dashboard_api:")
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def user_profile_api(request):
    """
    Get or update the logged-in user's profile
    """
    user = request.user
    if request.method == 'GET':
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'role_display': user.get_role_display() if hasattr(user, 'get_role_display') else user.role,
            'phone_number': getattr(user, 'phone_number', ''),
            'profile_picture': user.profile_picture.url if hasattr(user, 'profile_picture') and user.profile_picture else None
        })
    elif request.method == 'PUT':
        data = request.data
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.email = data.get('email', user.email)
        
        if hasattr(user, 'phone_number'):
            user.phone_number = data.get('phone_number', user.phone_number)
            
        if 'profile_picture' in request.FILES:
            user.profile_picture = request.FILES['profile_picture']
            
        user.save()
        return Response({'success': True, 'profile_picture': user.profile_picture.url if hasattr(user, 'profile_picture') and user.profile_picture else None})


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_api(request):
    """
    User change password endpoint
    """
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not user.check_password(old_password):
        return Response({'success': False, 'error': 'Invalid old password'}, status=400)
        
    user.set_password(new_password)
    user.save()
    return Response({'success': True, 'message': 'Password updated successfully'})


@csrf_exempt
@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def manage_users_api(request, pk=None):
    """
    User Management for PRINCIPAL and SUPER_ADMIN
    """
    user = request.user
    if getattr(user, 'role', '') not in [CustomUser.Role.PRINCIPAL, CustomUser.Role.SUPER_ADMIN] and not getattr(user, 'is_superuser', False):
        return Response({'error': 'Unauthorized'}, status=403)

    if request.method == 'GET':
        users = CustomUser.objects.all().order_by('-date_joined')
        return Response([{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'role': getattr(u, 'role', ''),
            'is_active': u.is_active,
            'last_login': u.last_login
        } for u in users])

    elif request.method == 'POST':
        # Create user
        data = request.data
        target_role = data.get('role', CustomUser.Role.TEACHER)
        
        # Principal cannot create Super Admins
        if getattr(user, 'role', '') == CustomUser.Role.PRINCIPAL and target_role in [CustomUser.Role.SUPER_ADMIN, CustomUser.Role.PRINCIPAL]:
            return Response({'error': 'Principals cannot create Admins or other Principals'}, status=403)
            
        if CustomUser.objects.filter(username=data.get('username')).exists():
            return Response({'error': 'Username already exists'}, status=400)
            
        new_user = CustomUser.objects.create(
            username=data.get('username'),
            email=data.get('email', ''),
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            role=target_role,
            is_active=data.get('is_active', True)
        )
        new_user.set_password(data.get('password', 'password123'))
        new_user.save()
        return Response({'success': True, 'id': new_user.id}, status=201)

    elif request.method == 'PUT':
        # Update user
        if not pk:
            return Response({'error': 'User ID required'}, status=400)
        try:
            target_user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
            
        data = request.data
        
        # Principal cannot modify Admins
        if getattr(user, 'role', '') == CustomUser.Role.PRINCIPAL and target_user.role == CustomUser.Role.SUPER_ADMIN:
            return Response({'error': 'Cannot modify Super Admin'}, status=403)
            
        target_user.first_name = data.get('first_name', target_user.first_name)
        target_user.last_name = data.get('last_name', target_user.last_name)
        target_user.email = data.get('email', target_user.email)
        target_user.is_active = data.get('is_active', target_user.is_active)
        
        if 'role' in data:
            new_role = data.get('role')
            if getattr(user, 'role', '') == CustomUser.Role.PRINCIPAL and new_role in [CustomUser.Role.SUPER_ADMIN, CustomUser.Role.PRINCIPAL]:
                pass # Ignore invalid role assignment attempt
            else:
                target_user.role = new_role
                
        # Password reset feature
        if data.get('reset_password'):
            target_user.set_password(data.get('reset_password'))
            
        target_user.save()
        return Response({'success': True})
