from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Supply, Release, Item

@receiver(post_save, sender=Supply)
def update_stock_on_supply(sender, instance, created, **kwargs):
    if created:
        item = instance.item
        item.stock_remaining += instance.quantity_supplied
        item.save()

@receiver(post_save, sender=Release)
def update_stock_on_release(sender, instance, created, **kwargs):
    if created:
        item = instance.item
        # Ensure we don't go below zero is handled in validation, 
        # but here we just subtract.
        if item.stock_remaining >= instance.quantity_released:
            item.stock_remaining -= instance.quantity_released
            item.save()
        else:
            # This case should ideally be prevented by form validation or model clean()
            # For now, we still subtract to show deficit if any, or we could raise Error.
            # But signals are not good places for validation errors.
            # We strictly subtract.
            item.stock_remaining = max(0, item.stock_remaining - instance.quantity_released)
            item.save()
