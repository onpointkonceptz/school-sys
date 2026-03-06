
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from academics.api import *
from academics.models import Subject, SubjectAllocation, GradingScale

User = get_user_model()

def verify_management():
    print("Verifying Academic Management Features...")
    factory = APIRequestFactory()
    user, _ = User.objects.get_or_create(username='manager_teacher', role='TEACHER')
    
    # 1. GRADING SCALES
    print("\n--- GRADE SCALES ---")
    
    # Create
    print("Creating Scale: 95-100 = S...")
    data = {'min_score': 95, 'max_score': 100, 'grade': 'S', 'remark': 'SUPER'}
    request = factory.post('/api/academics/grading-scales/save/', data)
    force_authenticate(request, user=user)
    res = save_grading_scale(request)
    if res.status_code == 200:
        scale_id = res.data['id']
        print(f"PASS: Created Scale ID {scale_id}")
    else:
        print("FAIL: Create Scale")
        return

    # 2. SUBJECTS
    print("\n--- SUBJECTS ---")
    
    # Create
    print("Creating Subject: Rocket Science...")
    data = {'name': 'Rocket Science', 'code': 'RKT'}
    request = factory.post('/api/academics/subjects/save/', data)
    force_authenticate(request, user=user)
    res = save_subject(request)
    if res.status_code == 200:
        subj_id = res.data['id']
        print(f"PASS: Created Subject ID {subj_id}")
    else:
        print("FAIL: Create Subject")
        return
        
    # Assign Implied
    SubjectAllocation.objects.create(teacher=user, subject_id=subj_id, class_grade='SSS 3', session='2025/2026')
    
    # 3. UNASSIGN
    print("\n--- UNASSIGN ---")
    alloc = SubjectAllocation.objects.get(subject_id=subj_id, class_grade='SSS 3')
    print(f"Unassigning Allocation {alloc.id}...")
    
    request = factory.post('/api/academics/unassign-subject/', {'allocation_id': alloc.id})
    force_authenticate(request, user=user)
    res = unassign_subject(request)
    
    if res.status_code == 200 and not SubjectAllocation.objects.filter(pk=alloc.id).exists():
         print("PASS: Unassigned Successfully")
    else:
         print("FAIL: Unassign")

    # Cleanup
    GradingScale.objects.filter(pk=scale_id).delete()
    Subject.objects.filter(pk=subj_id).delete()
    print("\nVerification Complete.")

if __name__ == "__main__":
    verify_management()
