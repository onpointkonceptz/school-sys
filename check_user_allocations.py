import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser
from academics.models import SubjectAllocation

print(f"{'Username':<20} | {'Role':<10} | {'Allocations':<5}")
print("-" * 40)

for user in CustomUser.objects.all():
    count = SubjectAllocation.objects.filter(teacher=user).count()
    print(f"{user.username:<20} | {user.role:<10} | {count:<5}")
