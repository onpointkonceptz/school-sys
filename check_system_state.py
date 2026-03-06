
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser
from academics.models import SubjectAllocation
from students.models import Student

def check_state():
    print("--- TEACHERS ---")
    teachers = CustomUser.objects.filter(role='TEACHER')
    for t in teachers:
        print(f"Teacher: {t.username} (ID: {t.id})")
        allocs = SubjectAllocation.objects.filter(teacher=t)
        print(f"  Allocations: {allocs.count()}")
        for a in allocs:
            student_count = Student.objects.filter(class_grade=a.class_grade).count()
            print(f"    - {a.subject.name} ({a.class_grade}): {student_count} Students")

    print("\n--- ADMINS ---")
    admins = CustomUser.objects.filter(role='SUPER_ADMIN')
    for a in admins:
        print(f"Admin: {a.username}")
        
    print("\n--- ALL ALLOCATIONS ---")
    all_allocs = SubjectAllocation.objects.all()
    if not all_allocs.exists():
        print("NO ALLOCATIONS EXIST!")
    else:
        print(f"Total Allocations: {all_allocs.count()}")

if __name__ == "__main__":
    check_state()
