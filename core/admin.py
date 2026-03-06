from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from simple_history.admin import SimpleHistoryAdmin

class CustomUserAdmin(UserAdmin, SimpleHistoryAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Role & Permissions', {'fields': ('role',)}),
    )
    list_display = UserAdmin.list_display + ('role',)
    list_filter = UserAdmin.list_filter + ('role',)

admin.site.register(CustomUser, CustomUserAdmin)
