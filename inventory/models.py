from django.db import models
from django.conf import settings
from simple_history.models import HistoricalRecords
from accounting.models import Expense, Transaction
from students.models import Student

class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100)
    
    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Item(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    stock_remaining = models.PositiveIntegerField(default=0)
    min_stock_level = models.PositiveIntegerField(default=10, help_text="Alert when stock falls below this")
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Price for sales to students/staff")
    
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.name} (Stock: {self.stock_remaining})"

class Supply(models.Model):
    """Records of items added to stock"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity_supplied = models.PositiveIntegerField()
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    purchased_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    date_supplied = models.DateTimeField(auto_now_add=True)
    
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    previous_quantity = models.PositiveIntegerField(default=0)
    new_quantity = models.PositiveIntegerField(default=0)
    
    # Financial Integration
    expense = models.ForeignKey(Expense, on_delete=models.SET_NULL, null=True, blank=True, help_text="Auto-generated expense record")
    
    history = HistoricalRecords()

    def __str__(self):
        return f"Supply: {self.item.name} +{self.quantity_supplied}"

class Release(models.Model):
    """Records of items given out (depleting stock)"""
    class ReleaseType(models.TextChoices):
        SOLD = 'SOLD', 'Sold to Student'
        ISSUED = 'ISSUED', 'Issued to Staff/Dept'
        DAMAGED = 'DAMAGED', 'Damaged/Expired'
        TRANSFER = 'TRANSFER', 'Transfer'
        OTHER = 'OTHER', 'Other'

    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity_released = models.PositiveIntegerField()
    release_type = models.CharField(max_length=20, choices=ReleaseType.choices, default=ReleaseType.SOLD)
    
    # Context
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True)
    recipient_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_items')
    recipient_department = models.CharField(max_length=100, blank=True)
    
    authorized_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='authorized_releases')
    date_released = models.DateTimeField(auto_now_add=True)
    
    previous_quantity = models.PositiveIntegerField(default=0)
    new_quantity = models.PositiveIntegerField(default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Financial Integration
    transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True, help_text="Auto-generated income record")
    
    history = HistoricalRecords()

    def __str__(self):
        return f"Release: {self.item.name} -{self.quantity_released} ({self.release_type})"
