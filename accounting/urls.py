from django.urls import path
from . import api

urlpatterns = [
    path('transactions/', api.transaction_list, name='transaction_list'),
    path('transactions/<int:pk>/', api.transaction_detail, name='transaction_detail'),
    path('payments/', api.record_payment, name='record_payment'),
    path('fee-config/', api.get_fee_config, name='get_fee_config'),
    
    # New Accounting Endpoints
    path('fee-structures/', api.manage_fee_structures, name='manage_fee_structures'),
    path('fee-structures/<int:pk>/', api.manage_fee_structures, name='manage_fee_structures_detail'),
    path('expenses/', api.expense_list_create, name='expense_list_create'),
    path('dashboard/', api.finance_dashboard, name='finance_dashboard'),
    path('ledger/', api.ledger_report, name='ledger_report'),
    path('reports/generate/', api.generate_report, name='generate_report'),
]
