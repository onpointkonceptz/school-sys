import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser
from academics.models import SubjectAllocation

def run():
    # 1. Find a Teacher
    teacher = CustomUser.objects.filter(role='TEACHER').first()
    if not teacher:
        print("No user with role 'TEACHER' found. Cannot assign.")
        return

    print(f"Found Teacher: {teacher.username}")

    # 2. Find Allocations
    allocations = SubjectAllocation.objects.all()
    if not allocations.exists():
        print("No allocations found to re-assign.")
        return

    # 3. Assign
    count = 0
    for alloc in allocations:
        alloc.teacher = teacher
        alloc.save()
        count += 1
        print(f"Assigned {alloc.subject.name} ({alloc.class_grade}) to {teacher.username}")

    print(f"\nSuccessfully re-assigned {count} subjects to {teacher.username}.")

if __name__ == '__main__':
    run()
