from django.urls import path
from . import api

urlpatterns = [
    path('', api.item_list_create, name='item_list_create'),
]
