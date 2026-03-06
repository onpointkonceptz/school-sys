from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from .models import CustomUser
from students.models import Student
from inventory.models import Item, Release
from accounting.models import Transaction, StudentFee
from simple_history.models import HistoricalRecords

from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def react_app(request):
    return render(request, 'index.html')

@login_required
def dashboard(request):
    user = request.user
    context = {}
    
    # If superuser or Chairman, show high-level stats
    if user.is_superuser or user.role == CustomUser.Role.CHAIRMAN:
        # High-level analytics
        total_revenue = Transaction.objects.aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0
        from inventory.models import Supply
        supplies = Supply.objects.all()
        total_expenditure = sum(s.quantity_supplied * s.unit_price for s in supplies)
        
        context.update({
            'total_revenue': total_revenue,
            'total_expenditure': total_expenditure,
            'recent_transactions': Transaction.objects.order_by('-date_paid')[:5],
            'is_chairman': True, # Flag for template
        })

    elif user.role == CustomUser.Role.PRINCIPAL:
        # Operational overview
        total_students = Student.objects.count()
        low_stock_items = Item.objects.filter(stock_remaining__lte=10)
        recent_releases = Release.objects.order_by('-date_released')[:5]
        
        context.update({
            'total_students': total_students,
            'low_stock_items': low_stock_items,
            'recent_releases': recent_releases,
        })

    elif user.role in [CustomUser.Role.ACCOUNT_OFFICER, CustomUser.Role.CASHIER]:
        # Debt tracking
        outstanding_fees = StudentFee.objects.filter(fully_paid=False).aggregate(
            total_debt=Sum('fee_structure__amount') - Sum('amount_paid')
        )['total_debt'] or 0
        
        recent_transactions = Transaction.objects.order_by('-date_paid')[:10]
        
        context.update({
            'outstanding_fees': outstanding_fees,
            'recent_transactions': recent_transactions,
        })

    elif user.role == CustomUser.Role.TEACHER:
        # Classroom records
        # Assuming teacher is linked to a class or just show all for now
        students = Student.objects.all()[:20] 
        context.update({
            'my_students': students
        })

    return render(request, 'core/dashboard.html', context)
