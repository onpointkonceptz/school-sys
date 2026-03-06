
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser

username = 'admin'
password = 'password123'
email = 'admin@school.com'

if not CustomUser.objects.filter(username=username).exists():
    CustomUser.objects.create_superuser(username=username, email=email, password=password)
    print(f"Superuser '{username}' created with password '{password}'")
else:
    print(f"Superuser '{username}' already exists")
