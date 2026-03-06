from django.contrib.auth.decorators import user_passes_test
from django.core.exceptions import PermissionDenied

def role_required(allowed_roles):
    """
    Decorator for views that checks if the logged-in user has one of the allowed roles.
    allowed_roles: list of roles (e.g. ['CHAIRMAN', 'PRINCIPAL'])
    """
    def check_role(user):
        if not user.is_authenticated:
            return False
        if user.role in allowed_roles or user.is_superuser:
            return True
        raise PermissionDenied("You do not have permission to access this resource.")
        
    return user_passes_test(check_role)
