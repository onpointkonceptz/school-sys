import os
import django
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.response import Response

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser
from students.api import dashboard_stats, student_list_create
from academics.api import get_teacher_classes

def debug():
    factory = APIRequestFactory()
    
    users = CustomUser.objects.all()
    print(f"--- Found {users.count()} users ---")
    
    for user in users:
        print(f"\nTesting User: {user.username} (Role: {user.role})")
        
        # 1. Test Academics: get_teacher_classes
        req = factory.get('/api/academics/teacher-classes/')
        force_authenticate(req, user=user)
        try:
            res = get_teacher_classes(req)
            data = res.data
            print(f"  [Academics] Classes Found: {len(data)}")
        except Exception as e:
            print(f"  [Academics] ERROR: {e}")

        # 2. Test Students: dashboard_stats
        req2 = factory.get('/api/students/dashboard-stats/')
        force_authenticate(req2, user=user)
        try:
            res2 = dashboard_stats(req2)
            data2 = res2.data
            # Stats is a list of classes
            total_students_seen = sum(d['total_students'] for d in data2)
            print(f"  [Students] Stats Classes: {len(data2)}, Total Students Visible: {total_students_seen}")
        except Exception as e:
            print(f"  [Students] ERROR: {e}")

if __name__ == '__main__':
    debug()
