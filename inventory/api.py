from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Sum, F
from django.utils import timezone
import uuid

from .models import Item, Category, Supplier, Supply, Release
from .serializers import ItemSerializer, CategorySerializer, SupplierSerializer, SupplySerializer, ReleaseSerializer

# Accounting Integration
from accounting.models import Expense, ExpenseCategory, Transaction, LedgerEntry
from students.models import Student

@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    total_items = Item.objects.count()
    low_stock = Item.objects.filter(stock_remaining__gt=0, stock_remaining__lte=F('min_stock_level')).count()
    out_of_stock = Item.objects.filter(stock_remaining=0).count()
    
    return Response({
        'total_items': total_items,
        'low_stock': low_stock,
        'out_of_stock': out_of_stock,
        'total_value': 0 # Removed as per user request
    })

# --- Items ---
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def item_list_create(request):
    if request.method == 'GET':
        items = Item.objects.all().order_by('name')
        serializer = ItemSerializer(items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['PUT', 'DELETE'])
@permission_classes([AllowAny])
def item_detail(request, pk):
    try:
        item = Item.objects.get(pk=pk)
    except Item.DoesNotExist:
        return Response(status=404)

    if request.method == 'PUT':
        serializer = ItemSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    elif request.method == 'DELETE':
        item.delete()
        return Response(status=204)

# --- Stock Actions ---

@api_view(['POST'])
@permission_classes([AllowAny])
def stock_in(request):
    """
    Stock-in is now handled exclusively via Accounts expenses.
    Please record an expense with 'is_inventory_purchase=True' to add stock.
    """
    return Response({
        'error': 'Direct stock-in is disabled. Record an Inventory Purchase expense in Accounts to add stock.'
    }, status=405)


@api_view(['POST'])
@permission_classes([AllowAny])
def stock_out(request):
    """
    Release stock (Quantity Only)
    """
    data = request.data
    try:
        item = Item.objects.get(pk=data['item_id'])
        qty = int(data['quantity'])
        release_type = data.get('type', Release.ReleaseType.SOLD)
        
        if item.stock_remaining < qty:
            return Response({'error': f'Not enough stock. Remaining: {item.stock_remaining}'}, status=400)

        previous_qty = item.stock_remaining
        new_qty = previous_qty - qty
        
        selling_price = float(data.get('selling_price', item.selling_price))
        total_amount = selling_price * qty
        
        # Transaction creation for SOLD items
        transaction = None
        if release_type == Release.ReleaseType.SOLD and total_amount > 0:
            student_id = data.get('student_id')
            if not student_id:
                  return Response({'error': 'Student ID is required for Sales'}, status=400)
            
            # Simple unique ref
            ref = f"INV-{uuid.uuid4().hex[:8].upper()}"
            transaction = Transaction.objects.create(
                student_id=student_id,
                amount_paid=total_amount,
                reference_number=ref,
                payment_method=Transaction.PaymentMethod.CASH,
                payment_type=Transaction.PaymentType.OTHERS,
                description=f"Purchase of {qty} x {item.name}",
                received_by=request.user if request.user.is_authenticated else None
            )

        # 1. Create Release Record
        release = Release.objects.create(
            item=item,
            quantity_released=qty,
            release_type=release_type,
            previous_quantity=previous_qty,
            new_quantity=new_qty,
            selling_price=selling_price,
            total_amount=total_amount,
            recipient_department=data.get('receiver', ''),  # Use receiver for all details
            student_id=data.get('student_id') if release_type == Release.ReleaseType.SOLD else None,
            recipient_user_id=data.get('recipient_user_id') if release_type == Release.ReleaseType.ISSUED else None,
            authorized_by=request.user if request.user.is_authenticated else None,
            transaction=transaction
        )
        
        # 2. Update Item Stock
        item.stock_remaining = new_qty
        item.save()
        
        return Response({'success': True, 'new_stock': item.stock_remaining})

    except Item.DoesNotExist:
        return Response({'error': 'Item not found'}, status=404)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def movement_log(request):
    # Fetch latest supplies and releases, combine and sort?
    # Or just return them separately for the frontend to merge
    supplies = Supply.objects.select_related('item', 'supplier', 'purchased_by').all().order_by('-date_supplied')[:50]
    releases = Release.objects.select_related('item', 'student', 'authorized_by', 'recipient_user').all().order_by('-date_released')[:50]
    
    data = []
    for s in supplies:
        data.append({
            'type': 'IN',
            'item': s.item.name,
            'qty': s.quantity_supplied,
            'prev_qty': s.previous_quantity,
            'new_qty': s.new_quantity,
            'financial': float(s.total_cost),
            'date': s.date_supplied,
            'issued_by': s.purchased_by.get_full_name() or s.purchased_by.username if s.purchased_by else 'System',
            'received_by': s.supplier.name if s.supplier else 'N/A',
            'reason': 'Stock Purchase',
        })
        
    for r in releases:
        # If a custom receiver string was provided, use it. Otherwise fallback to foreign keys.
        if r.recipient_department:
            received_by = r.recipient_department
        elif r.release_type == 'SOLD' and r.student:
            received_by = f"{r.student.first_name} {r.student.last_name} ({r.student.admission_number})"
        elif r.release_type == 'ISSUED' and r.recipient_user:
            received_by = r.recipient_user.get_full_name() or r.recipient_user.username
        else:
            received_by = 'N/A'

        data.append({
            'type': 'OUT',
            'item': r.item.name,
            'qty': r.quantity_released,
            'prev_qty': r.previous_quantity,
            'new_qty': r.new_quantity,
            'financial': float(r.total_amount),
            'date': r.date_released,
            'issued_by': r.authorized_by.get_full_name() or r.authorized_by.username if r.authorized_by else 'System',
            'received_by': received_by,
            'reason': r.get_release_type_display(),
        })
    
    data.sort(key=lambda x: x['date'], reverse=True)
    return Response(data)
