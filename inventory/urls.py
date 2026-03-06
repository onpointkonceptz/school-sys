from django.urls import path
from . import api

urlpatterns = [
    path('dashboard/', api.dashboard_stats, name='inventory_dashboard'),
    path('items/', api.item_list_create, name='item_list_create'),
    path('items/<int:pk>/', api.item_detail, name='item_detail'),
    path('stock/in/', api.stock_in, name='stock_in'),
    path('stock/out/', api.stock_out, name='stock_out'),
    path('movements/', api.movement_log, name='movement_log'),
]
