from django.urls import path
from . import api

urlpatterns = [
    path('', api.student_list_create, name='student_list_create'),
    path('<int:pk>/', api.student_detail, name='student_detail'),
    path('<int:pk>/promote/', api.promote_student, name='promote_student'),
    path('dashboard-stats/', api.dashboard_stats, name='dashboard_stats'),
    path('preview-promotion/', api.preview_promotion, name='preview_promotion'),
    path('bulk-promote/', api.bulk_promote_class, name='bulk_promote_class'),
]
