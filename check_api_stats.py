import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate

from core.api import dashboard_api
from students.api import dashboard_stats
from core.models import CustomUser

def run():
    factory = APIRequestFactory()
    request = factory.get('/api/students/dashboard-stats/')
    
    # Check as Admin first (should see all)
    admin = CustomUser.objects.filter(is_superuser=True).first()
    print(f"\n--- Checking as Admin: {admin.username} ---")
    force_authenticate(request, user=admin)
    response = dashboard_stats(request)
    if response.status_code == 200:
        for item in response.data:
            if item['total_students'] > 0:
                print(f"{item['label']} ({item['code']}): {item['total_students']}")
    else:
        print("Error fetching stats")

    # Check as Teacher (should see allocated)
    teacher = CustomUser.objects.filter(role='TEACHER').first()
    print(f"\n--- Checking as Teacher: {teacher.username} ---")
    force_authenticate(request, user=teacher)
    response = dashboard_stats(request)
    if response.status_code == 200:
         for item in response.data:
            if item['total_students'] > 0:
                print(f"{item['label']} ({item['code']}): {item['total_students']}")
    else:
        print("Error fetching stats")

if __name__ == '__main__':
    run()
