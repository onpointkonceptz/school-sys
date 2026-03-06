from django.contrib import admin
from .models import FeeStructure, StudentFee, Transaction, ExpenseCategory, Expense, LedgerEntry


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('name', 'class_grade', 'student_status', 'student_type', 'term', 'session', 'amount')
    list_filter = ('class_grade', 'student_status', 'student_type', 'term', 'session')
    search_fields = ('name',)
    ordering = ('class_grade', 'name')


@admin.register(StudentFee)
class StudentFeeAdmin(admin.ModelAdmin):
    list_display = ('student', 'term', 'session', 'total_amount_payable', 'amount_paid', 'is_fully_paid', 'last_payment_date')
    list_filter = ('term', 'session', 'is_fully_paid')
    search_fields = ('student__first_name', 'student__last_name', 'student__admission_number')
    ordering = ('-session', '-term', 'student__last_name')
    raw_id_fields = ('student',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('student', 'payment_type', 'payment_method', 'amount_paid', 'reference_number', 'term', 'session', 'date_paid', 'received_by')
    list_filter = ('payment_type', 'payment_method', 'term', 'session')
    search_fields = ('student__first_name', 'student__last_name', 'student__admission_number', 'reference_number')
    ordering = ('-date_paid',)
    raw_id_fields = ('student',)


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'amount', 'date_incurred', 'term', 'session', 'recorded_by')
    list_filter = ('category', 'term', 'session')
    search_fields = ('title', 'description')
    ordering = ('-date_incurred',)


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_type', 'amount', 'description', 'transaction_date', 'term', 'session', 'reference')
    list_filter = ('entry_type', 'term', 'session')
    search_fields = ('description', 'reference')
    ordering = ('-transaction_date',)
