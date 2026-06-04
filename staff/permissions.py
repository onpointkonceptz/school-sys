from rest_framework import permissions
from core.models import CustomUser

class IsStaffAdmin(permissions.BasePermission):
    """
    Allows access only to Super Admins and Principals.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super Admin or Principal
        return request.user.role in [CustomUser.Role.SUPER_ADMIN, CustomUser.Role.PRINCIPAL] or request.user.is_superuser
