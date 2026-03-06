from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Transaction, Expense, LedgerEntry

@receiver(post_save, sender=Transaction)
def log_transaction_to_ledger(sender, instance, created, **kwargs):
    """
    Automatically create or update a LedgerEntry when a Student Transaction (Income) occurs.
    """
    LedgerEntry.objects.update_or_create(
        student_transaction=instance,
        defaults={
            'transaction_date': instance.date_paid,
            'amount': instance.amount_paid,
            'entry_type': LedgerEntry.EntryType.INCOME,
            'description': f"{instance.payment_type} - {instance.student.first_name} {instance.student.last_name} ({instance.payment_method})",
            'reference': instance.reference_number,
            'term': instance.term, 
            'session': instance.session
        }
    )

@receiver(post_delete, sender=Transaction)
def delete_transaction_ledger_entry(sender, instance, **kwargs):
    LedgerEntry.objects.filter(student_transaction=instance).delete()


@receiver(post_save, sender=Expense)
def log_expense_to_ledger(sender, instance, created, **kwargs):
    """
    Automatically create or update a LedgerEntry when an Expense is recorded.
    """
    LedgerEntry.objects.update_or_create(
        expense=instance,
        defaults={
            'transaction_date': instance.date_incurred,
            'amount': instance.amount,
            'entry_type': LedgerEntry.EntryType.EXPENSE,
            'description': f"{instance.category.name}: {instance.title}",
            'reference': f"EXP-{instance.id}",
            'term': instance.term,
            'session': instance.session
        }
    )

@receiver(post_delete, sender=Expense)
def delete_expense_ledger_entry(sender, instance, **kwargs):
    LedgerEntry.objects.filter(expense=instance).delete()
