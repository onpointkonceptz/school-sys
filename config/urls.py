"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from core import views as core_views
from core import api as core_api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),
    path('', core_views.react_app, name='dashboard'),   # Serve React App
    path('api/dashboard/', core_api.dashboard_api, name='dashboard_api'),
    path('api/login/', core_api.login_api, name='login_api'),
    path('api/logout/', core_api.logout_api, name='logout_api'),
    
    # User Profile & Management
    path('api/profile/', core_api.user_profile_api, name='user_profile_api'),
    path('api/password/', core_api.change_password_api, name='change_password_api'),
    path('api/users/', core_api.manage_users_api, name='manage_users_list'),
    path('api/users/<int:pk>/', core_api.manage_users_api, name='manage_users_detail'),
    
    # Module APIs
    path('api/students/', include('students.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/accounts/', include('accounting.urls')),
    path('api/academics/', include('academics.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
