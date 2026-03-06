import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_sys.settings')
django.setup()

User = get_user_model()
username = 'admin'
email = 'admin@example.com'
password = 'password123'

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f"Superuser '{username}' created successfully.")
else:
    user = User.objects.get(username=username)
    user.set_password(password)
    user.save()
    print(f"Superuser '{username}' password reset successfully.")
