import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser

def create_users():
    users = [
        {'username': 'principal', 'password': 'password123', 'role': CustomUser.Role.PRINCIPAL},
        {'username': 'accountant', 'password': 'password123', 'role': CustomUser.Role.ACCOUNT_OFFICER},
        {'username': 'cashier', 'password': 'password123', 'role': CustomUser.Role.CASHIER},
        {'username': 'teacher', 'password': 'password123', 'role': CustomUser.Role.TEACHER},
    ]

    for u in users:
        if not CustomUser.objects.filter(username=u['username']).exists():
            user = CustomUser.objects.create_user(username=u['username'], password=u['password'], role=u['role'])
            print(f"Created user: {u['username']} ({u['role']})")
        else:
            print(f"User {u['username']} already exists")

if __name__ == '__main__':
    create_users()
