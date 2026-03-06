from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Transaction, StudentFee, FeeStructure
from students.models import Student
from django.db.models import Sum
import uuid
from django.utils import timezone

@api_view(['GET'])
@permission_classes([AllowAny])
def transaction_list(request):
    transactions = Transaction.objects.select_related('student', 'received_by').all().order_by('-date_paid')
    data = [{
        'id': t.id,
        'reference_number': t.reference_number,
        'student_name': f"{t.student.first_name} {t.student.last_name}",
        'admission_number': t.student.admission_number,
        'amount_paid': t.amount_paid,
        'date_paid': t.date_paid,
        'received_by': t.received_by.username if t.received_by else 'System'
    } for t in transactions]
    return Response(data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_fee_config(request):
    """
    Returns the calculated fee for a given student configuration
    Query params: class_grade, student_type, student_status
    """
    class_grade = request.query_params.get('class_grade')
    student_type = request.query_params.get('student_type')
    student_status = request.query_params.get('student_status')
    
    if not all([class_grade, student_type, student_status]):
        return Response({'amount': 0, 'breakdown': []})

    # Find matching fees
    # 1. Fees for specific class OR all classes
    # 2. Fees for specific status OR all statuses
    # 3. Fees for specific type OR all types
    
    # We want:
    # - General fees (e.g. PTA)
    # - Class specific fees (e.g. Tuition)
    # - Type specific fees (e.g. Boarding)
    
    fees = FeeStructure.objects.filter(
        class_grade__in=[class_grade, None, ''],
        student_status__in=[student_status, None, ''],
        student_type__in=[student_type, None, '']
    )
    
    total = sum(f.amount for f in fees)
    breakdown = [{'name': f.name, 'amount': f.amount} for f in fees]
    
    return Response({'amount': total, 'breakdown': breakdown})


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([AllowAny])
def manage_fee_structures(request, pk=None):
    """
    CRUD for Fee Structures.
    Only Account Officers and Super Admins can access this.
    """
    user = request.user
    if user.is_authenticated and hasattr(user, 'role') and user.role not in ['ACCOUNT_OFFICER', 'SUPER_ADMIN']:
        return Response({'error': 'Only Account Officers or Admins can manage fee structures.'}, status=403)

    if request.method == 'GET':
        fees = FeeStructure.objects.all().order_by('-id')
        data = [{
            'id': f.id,
            'name': f.name,
            'amount': str(f.amount),
            'class_grade': f.class_grade,
            'student_status': f.student_status,
            'student_type': f.student_type,
            'term': f.term,
            'session': f.session,
        } for f in fees]
        return Response(data)

    elif request.method == 'POST':
        data = request.data
        if pk:
            try:
                fee = FeeStructure.objects.get(pk=pk)
            except FeeStructure.DoesNotExist:
                return Response({'error': 'Fee Structure not found'}, status=404)
        else:
            fee = FeeStructure()

        fee.name = data.get('name')
        fee.amount = data.get('amount')
        
        # Handle empty strings as None for nullable choice fields
        fee.class_grade = data.get('class_grade') or None
        fee.student_status = data.get('student_status') or None
        fee.student_type = data.get('student_type') or None
        
        fee.term = data.get('term', '1st Term')
        fee.session = data.get('session', '2025/2026')
        fee.save()

        return Response({'success': True, 'id': fee.id}, status=201 if not pk else 200)

    elif request.method == 'DELETE':
        try:
            fee = FeeStructure.objects.get(pk=pk)
            fee.delete()
            return Response({'success': True})
        except FeeStructure.DoesNotExist:
            return Response({'error': 'Fee Structure not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def record_payment(request):
    # Only financial roles can record payments
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role == 'TEACHER':
        return Response({'success': False, 'error': 'Teachers are not authorised to record payments.'}, status=403)
    data = request.data
    try:
        student = Student.objects.get(admission_number=data['admission_number'])
        amount = float(data['amount'])
        
        # record transaction
        transaction = Transaction.objects.create(
            student=student,
            amount_paid=amount,
            reference_number=str(uuid.uuid4())[:12].upper(),
            received_by=request.user if request.user.is_authenticated else None,
            description=data.get('description', 'Fee Payment'),
            # New Fields
            payment_method=data.get('payment_method', 'CASH'),
            payment_type=data.get('payment_type', 'TUITION'),
            term=data.get('term', student.current_term),
            session=data.get('session', student.current_session)
        )
        
        # Update or Create StudentFee record for this term
        # Logic: Find the current active fee record or create one
        current_term = student.current_term
        current_session = student.current_session
        
        student_fee, created = StudentFee.objects.get_or_create(
            student=student,
            term=current_term,
            session=current_session,
            defaults={'total_amount_payable': 0} # Should be set by logic elsewhere or passed in?
        )
        
        # If it was just created (or even if existing), we might need to rely on the frontend
        # passing the "Expected Total Fee" or recalculating it here.
        # For robustness, let's recalculate if it's 0.
        if student_fee.total_amount_payable == 0:
             # Calculate based on student profile
             fees = FeeStructure.objects.filter(
                class_grade__in=[student.class_grade, None, ''],
                student_status__in=[student.student_status, None, ''],
                student_type__in=[student.student_type, None, '']
             )
             student_fee.total_amount_payable = sum(f.amount for f in fees)
        
        student_fee.amount_paid = float(student_fee.amount_paid) + amount
        student_fee.last_payment_date = timezone.now()
        
        if student_fee.amount_paid >= student_fee.total_amount_payable:
            student_fee.is_fully_paid = True
            
        student_fee.save()

        return Response({
            'success': True, 
            'id': transaction.id, 
            'ref': transaction.reference_number,
            'balance': student_fee.outstanding_balance
        })
    except Student.DoesNotExist:
        return Response({'success': False, 'error': 'Student not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=400)


@api_view(['PUT', 'DELETE'])
@permission_classes([AllowAny])
def transaction_detail(request, pk):
    # Only financial roles can edit or delete transactions
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role == 'TEACHER':
        return Response({'error': 'Teachers are not authorised to modify transactions.'}, status=403)
    try:
        transaction = Transaction.objects.get(pk=pk)
    except Transaction.DoesNotExist:
        return Response(status=404)

    student = transaction.student
    # Find related fee record (assuming current term/session or based on transaction date?)
    # Ideally transaction should link to StudentFee, but for now we look up by student/term
    # Or just update the latest one.
    # BEST APPROACH: Re-calculate all payments for this student/term to be safe.
    
    fee_record = StudentFee.objects.filter(
        student=student, 
        term=student.current_term, 
        session=student.current_session
    ).last()

    if request.method == 'PUT':
        old_amount = transaction.amount_paid
        data = request.data
        
        transaction.amount_paid = float(data.get('amount_paid', transaction.amount_paid))
        transaction.description = data.get('description', transaction.description)
        # Update date if provided? 
        # transaction.date_paid = ... (be careful with auto_now_add)
        transaction.save()
        
        new_amount = transaction.amount_paid
        
        # Update Fee Record
        if fee_record:
            fee_record.amount_paid = float(fee_record.amount_paid) - float(old_amount) + float(new_amount)
            # Recheck fully paid status
            if fee_record.amount_paid >= fee_record.total_amount_payable:
                fee_record.is_fully_paid = True
            else:
                fee_record.is_fully_paid = False
            fee_record.save()
            
        return Response({'success': True})

    elif request.method == 'DELETE':
        amount = transaction.amount_paid
        transaction.delete()
        
        if fee_record:
            fee_record.amount_paid = float(fee_record.amount_paid) - float(amount)
            if fee_record.amount_paid < fee_record.total_amount_payable:
                fee_record.is_fully_paid = False
            fee_record.save()
            
        return Response(status=204)


# --- New Accounts API Endpoints ---
from .models import Expense, ExpenseCategory, LedgerEntry

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def expense_list_create(request):
    if request.method == 'GET':
        expenses = Expense.objects.select_related('category', 'recorded_by', 'inventory_item').order_by('-date_incurred')
        data = [{
            'id': e.id,
            'title': e.title,
            'amount': e.amount,
            'category': e.category.name,
            'date': e.date_incurred,
            'term': e.term,
            'session': e.session,
            'recorded_by': e.recorded_by.username if e.recorded_by else 'System',
            'is_inventory_purchase': e.is_inventory_purchase,
            'inventory_item_name': e.inventory_item_name,
            'inventory_quantity': e.inventory_quantity,
            'inventory_unit_cost': float(e.inventory_unit_cost) if e.inventory_unit_cost else None,
        } for e in expenses]
        return Response(data)
    
    elif request.method == 'POST':
        data = request.data
        try:
            is_inventory = data.get('is_inventory_purchase', False)
            item_name = data.get('inventory_item_name', '').strip()
            inv_qty = int(data.get('inventory_quantity', 0) or 0)
            inv_unit_cost = float(data.get('inventory_unit_cost', 0) or 0)

            # Compute amount: if it's an inventory purchase, total = qty * unit_cost
            if is_inventory and inv_qty > 0 and inv_unit_cost > 0:
                total_amount = inv_qty * inv_unit_cost
            else:
                total_amount = float(data['amount'])

            category_name = 'Inventory Supplies' if is_inventory else data['category']
            category, _ = ExpenseCategory.objects.get_or_create(name=category_name)

            expense = Expense.objects.create(
                category=category,
                title=data.get('title') or f"Purchase of {item_name}" if is_inventory else data['title'],
                amount=total_amount,
                description=data.get('description', ''),
                date_incurred=data.get('date_incurred', timezone.now().date()),
                term=data.get('term', '1st Term'),
                session=data.get('session', '2025/2026'),
                recorded_by=request.user if request.user.is_authenticated else None,
                is_inventory_purchase=is_inventory,
                inventory_item_name=item_name if is_inventory else '',
                inventory_quantity=inv_qty if is_inventory else None,
                inventory_unit_cost=inv_unit_cost if is_inventory else None,
            )

            # Auto-create / update inventory if this is an inventory purchase
            if is_inventory and item_name and inv_qty > 0:
                from inventory.models import Item, Supply
                item, created = Item.objects.get_or_create(
                    name__iexact=item_name,
                    defaults={
                        'name': item_name,
                        'min_stock_level': 10,
                        'description': f'Auto-created from Accounts expense on {timezone.now().date()}',
                    }
                )
                previous_qty = item.stock_remaining
                new_qty = previous_qty + inv_qty

                Supply.objects.create(
                    item=item,
                    quantity_supplied=inv_qty,
                    unit_cost=inv_unit_cost,
                    total_cost=total_amount,
                    previous_quantity=previous_qty,
                    new_quantity=new_qty,
                    purchased_by=request.user if request.user.is_authenticated else None,
                    expense=expense,
                )

                item.stock_remaining = new_qty
                item.save(update_fields=['stock_remaining'])

                # Link expense back to the item
                expense.inventory_item = item
                expense.save(update_fields=['inventory_item'])

            return Response({'success': True, 'id': expense.id})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def finance_dashboard(request):
    # Get filters
    term = request.query_params.get('term', '1st Term')
    session = request.query_params.get('session', '2025/2026')
    
    # 1. Totals
    ledger = LedgerEntry.objects.filter(session=session, term=term)
    
    total_income = ledger.filter(entry_type=LedgerEntry.EntryType.INCOME).aggregate(Sum('amount'))['amount__sum'] or 0
    total_expense = ledger.filter(entry_type=LedgerEntry.EntryType.EXPENSE).aggregate(Sum('amount'))['amount__sum'] or 0
    net_balance = total_income - total_expense
    
    # 2. Outstanding Fees (Global)
    # This might be heavy, so maybe cache or optimize
    outstanding_fees = StudentFee.objects.filter(session=session, term=term).aggregate(
        total_payable=Sum('total_amount_payable'),
        total_paid=Sum('amount_paid')
    )
    total_outstanding = (outstanding_fees['total_payable'] or 0) - (outstanding_fees['total_paid'] or 0)
    
    # 3. Class Breakdown
    # Aggregate fees by class grade
    breakdown_qs = StudentFee.objects.filter(session=session, term=term).values(
        'student__class_grade'
    ).annotate(
        total_expected=Sum('total_amount_payable'),
        total_collected=Sum('amount_paid')
    )
    
    # Map to list with labels
    class_map = dict(Student.ClassGrade.choices)
    class_stats = []
    
    # Create a dict for easy lookup of aggregated data
    data_lookup = {item['student__class_grade']: item for item in breakdown_qs}
    
    # Iterate through all defined classes to ensure even empty ones are shown (optional, but good for UI)
    # Or just show ones with data. Let's show all for completeness as requested.
    for code, label in Student.ClassGrade.choices:
        stat = data_lookup.get(code, {'total_expected': 0, 'total_collected': 0})
        expected = stat['total_expected'] or 0
        collected = stat['total_collected'] or 0
        
        class_stats.append({
            'class_grade': label,
            'expected': expected,
            'collected': collected,
            'outstanding': expected - collected
        })

    return Response({
        'summary': {
            'total_income': total_income,
            'total_expense': total_expense,
            'net_balance': net_balance,
            'total_outstanding': total_outstanding
        },
        'class_breakdown': class_stats,
        'recent_activity': [{
            'date': l.transaction_date,
            'type': l.entry_type,
            'amount': l.amount,
            'description': l.description,
            'reference': l.reference
        } for l in LedgerEntry.objects.all().order_by('-created_at')[:10]]
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def ledger_report(request):
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    entries = LedgerEntry.objects.all().order_by('-transaction_date')
    
    if start_date:
        entries = entries.filter(transaction_date__date__gte=start_date)
    if end_date:
        entries = entries.filter(transaction_date__date__lte=end_date)
        
    data = [{
        'id': e.id,
        'date': e.transaction_date,
        'type': e.entry_type,
        'amount': e.amount,
        'description': e.description,
        'reference': e.reference,
        'session': e.session,
        'term': e.term
    } for e in entries]
    
    return Response(data)
@api_view(['GET'])
@permission_classes([AllowAny])
def generate_report(request):
    report_type = request.query_params.get('type', 'FEES')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    class_filter = request.query_params.get('class_filter')
    
    data = []
    
    if report_type == 'FEES':
        # Transactions — only include those linked to a student
        qs = Transaction.objects.select_related('student').filter(student__isnull=False).order_by('-date_paid')
        if start_date: qs = qs.filter(date_paid__date__gte=start_date)
        if end_date: qs = qs.filter(date_paid__date__lte=end_date)
        if class_filter: qs = qs.filter(student__class_grade=class_filter)
        
        data = [{
            'date': str(t.date_paid.date()),
            'student': f"{t.student.first_name} {t.student.last_name}",
            'admission_no': t.student.admission_number,
            'class': t.student.class_grade or '',
            'description': t.description or '',
            'amount': float(t.amount_paid),
            'method': t.payment_method,
            'ref': t.reference_number or ''
        } for t in qs]

    elif report_type == 'DEFAULTERS':
        # Students with outstanding balance
        qs = StudentFee.objects.select_related('student').filter(is_fully_paid=False)
        # Date filtering might not apply strictly to "current debt", but maybe "debt for session"
        # For now, we list all current debt.
        if class_filter: qs = qs.filter(student__class_grade=class_filter)
        
        data = [{
            'student': f"{s.student.first_name} {s.student.last_name}",
            'admission_no': s.student.admission_number,
            'class': s.student.class_grade,
            'parent_phone': s.student.parent_phone,
            'total_payable': s.total_amount_payable,
            'amount_paid': s.amount_paid,
            'outstanding': s.outstanding_balance,
            'term': s.term
        } for s in qs if s.outstanding_balance > 0]

    elif report_type == 'EXPENSES':
        qs = Expense.objects.select_related('category', 'recorded_by').all().order_by('-date_incurred')
        if start_date: qs = qs.filter(date_incurred__gte=start_date)
        if end_date: qs = qs.filter(date_incurred__lte=end_date)
        
        data = [{
            'date': str(e.date_incurred),
            'title': e.title or '',
            'category': e.category.name if e.category else 'Uncategorised',
            'amount': float(e.amount),
            'description': e.description or '',
            'recorded_by': e.recorded_by.username if e.recorded_by else 'System'
        } for e in qs]

    elif report_type == 'SUMMARY':
        # Simple Income vs Expense Aggregation
        # This re-uses logic from dashboard but specific to date range
        income_qs = Transaction.objects.all()
        expense_qs = Expense.objects.all()
        
        if start_date:
            income_qs = income_qs.filter(date_paid__date__gte=start_date)
            expense_qs = expense_qs.filter(date_incurred__gte=start_date)
        if end_date:
            income_qs = income_qs.filter(date_paid__date__lte=end_date)
            expense_qs = expense_qs.filter(date_incurred__lte=end_date)
            
        total_income = income_qs.aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0
        total_expense = expense_qs.aggregate(Sum('amount'))['amount__sum'] or 0
        
        data = [{
            'metric': 'Total Income',
            'value': float(total_income)
        }, {
            'metric': 'Total Expenses',
            'value': float(total_expense)
        }, {
            'metric': 'Net Balance',
            'value': float(total_income) - float(total_expense)
        }]

    return Response(data)
