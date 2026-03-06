from django.db import models
from django.conf import settings
from simple_history.models import HistoricalRecords
from students.models import Student

class FeeStructure(models.Model):
    """
    Defines the standard fee for a specific category of student.
    Example: JSS1 - New Student - Boarding - 1st Term = 150,000
    """
    name = models.CharField(max_length=100, help_text="e.g. School Fees, Uniform, Books")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Criteria
    class_grade = models.CharField(max_length=20, choices=Student.ClassGrade.choices, null=True, blank=True, help_text="Leave blank if applies to all classes")
    student_status = models.CharField(max_length=20, choices=Student.StudentStatus.choices, null=True, blank=True, help_text="New vs Returning")
    student_type = models.CharField(max_length=20, choices=Student.StudentType.choices, null=True, blank=True, help_text="Day vs Boarding")
    
    term = models.CharField(max_length=50, default='1st Term')
    session = models.CharField(max_length=50, default='2025/2026')
    
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.name} - {self.class_grade or 'All'} ({self.amount})"

class StudentFee(models.Model):
    """
    The actual bill assigned to a specific student.
    Can be a sum of multiple FeeStructures or a single consolidated bill.
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fees')
    term = models.CharField(max_length=50)
    session = models.CharField(max_length=50)
    
    # Financials
    total_amount_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Total bill for this term")
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    is_fully_paid = models.BooleanField(default=False)
    last_payment_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    history = HistoricalRecords()

    @property
    def outstanding_balance(self):
        return self.total_amount_payable - self.amount_paid

    def __str__(self):
        return f"{self.student} - {self.term} - Bal: {self.outstanding_balance}"

class Transaction(models.Model):
    """Records real payments made by students"""
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Cash'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        POS = 'POS', 'POS'
        CHEQUE = 'CHEQUE', 'Cheque'
        ONLINE = 'ONLINE', 'Online Payment'

    class PaymentType(models.TextChoices):
        TUITION = 'TUITION', 'Tuition Fees'
        BOARDING = 'BOARDING', 'Boarding Fees'
        ADMISSION = 'ADMISSION', 'Admission Fees'
        PTA = 'PTA', 'PTA Levey'
        EXAM = 'EXAM', 'Exam Fees'
        DEVELOPMENT = 'DEVELOPMENT', 'Development Levy'
        UNIFORM = 'UNIFORM', 'Uniforms'
        BOOKS = 'BOOKS', 'Books'
        OTHERS = 'OTHERS', 'Other Levies'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='transactions')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    reference_number = models.CharField(max_length=50, unique=True)
    
    # New Fields
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices, default=PaymentType.TUITION)
    term = models.CharField(max_length=50, default='1st Term')
    session = models.CharField(max_length=50, default='2025/2026')
    
    date_paid = models.DateTimeField(auto_now_add=True)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    description = models.TextField(blank=True, help_text="Notes about the payment")
    
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.payment_type} Payment: {self.amount_paid} by {self.student}"


# --- New Accounts Module Models ---

class ExpenseCategory(models.Model):
    """Categorization for expenses, e.g. Salaries, Utilities, Maintenance"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class Expense(models.Model):
    """Records outflows/expenditures"""
    category = models.ForeignKey(ExpenseCategory, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    date_incurred = models.DateField()
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    receipt_doc = models.FileField(upload_to='expense_receipts/', null=True, blank=True)
    
    # Session/Term Context
    term = models.CharField(max_length=50, default='1st Term')
    session = models.CharField(max_length=50, default='2025/2026')
    
    # Inventory Integration
    is_inventory_purchase = models.BooleanField(default=False, help_text="If True, this expense will auto-increase inventory stock")
    inventory_item_name = models.CharField(max_length=200, blank=True, help_text="Name of the inventory item purchased")
    inventory_quantity = models.PositiveIntegerField(null=True, blank=True, help_text="Quantity of items purchased")
    inventory_unit_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    inventory_item = models.ForeignKey('inventory.Item', on_delete=models.SET_NULL, null=True, blank=True, related_name='expense_purchases')
    
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.title} ({self.amount})"

class LedgerEntry(models.Model):
    """
    Unified Financial Record.
    Automatically populated via Signals when:
    1. A Transaction is created (Income)
    2. An Expense is created (Expense)
    """
    class EntryType(models.TextChoices):
        INCOME = 'INCOME', 'Income'
        EXPENSE = 'EXPENSE', 'Expense'

    transaction_date = models.DateTimeField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    entry_type = models.CharField(max_length=10, choices=EntryType.choices)
    description = models.TextField()
    reference = models.CharField(max_length=100) # Transaction Ref or Expense ID
    
    # Links to source (optional but useful for drill-down)
    student_transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, null=True, blank=True, related_name='ledger_entry')
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, null=True, blank=True, related_name='ledger_entry')
    
    term = models.CharField(max_length=50, null=True, blank=True)
    session = models.CharField(max_length=50, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-transaction_date']

    def __str__(self):
        return f"{self.entry_type}: {self.amount} - {self.description}"
