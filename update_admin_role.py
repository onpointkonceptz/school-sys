import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser

def run():
    u = CustomUser.objects.filter(username='admin').first()
    if u:
        u.role = CustomUser.Role.SUPER_ADMIN
        u.save()
        print(f"Updated {u.username} role to: {u.role}")
    else:
        # Create Super Admin if not exists
        u = CustomUser.objects.create_superuser('admin', 'admin@example.com', 'password123')
        u.role = CustomUser.Role.SUPER_ADMIN
        u.save()
        print(f"Created {u.username} with role: {u.role}")

if __name__ == '__main__':
    run()
