from django.contrib import admin
from .models import Supplier, Category, Item, Supply, Release


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'phone', 'email')
    search_fields = ('name', 'contact_person', 'phone')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'stock_remaining', 'min_stock_level', 'supplier')
    list_filter = ('category',)
    search_fields = ('name', 'description')
    ordering = ('category', 'name')


@admin.register(Supply)
class SupplyAdmin(admin.ModelAdmin):
    list_display = ('item', 'quantity_supplied', 'supplier', 'purchased_by', 'date_supplied')
    list_filter = ('supplier',)
    search_fields = ('item__name',)
    ordering = ('-date_supplied',)
    raw_id_fields = ('item',)


@admin.register(Release)
class ReleaseAdmin(admin.ModelAdmin):
    list_display = ('item', 'quantity_released', 'release_type', 'student', 'recipient_department', 'authorized_by', 'date_released')
    list_filter = ('release_type',)
    search_fields = ('item__name', 'student__first_name', 'student__last_name', 'recipient_department')
    ordering = ('-date_released',)
    raw_id_fields = ('item', 'student')
