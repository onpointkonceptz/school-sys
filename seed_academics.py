import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from academics.models import Subject, SubjectAllocation
from students.models import Student
from core.models import CustomUser

def run():
    print("Seeding Academics Data...")

    # 1. Ensure Subjects exist
    maths, _ = Subject.objects.get_or_create(name="Mathematics")
    english, _ = Subject.objects.get_or_create(name="English Language")
    science, _ = Subject.objects.get_or_create(name="Basic Science")
    
    # 2. Get a teacher (or creating one if needed, but likely using first admin/teacher found)
    # Ideally assign to the logged-in user if possible, but for now just pick the first user
    teacher = CustomUser.objects.filter(role__in=['TEACHER', 'PRINCIPAL', 'CHAIRMAN']).first()
    if not teacher:
        print("No suitable user found to assign as teacher. Creating one.")
        teacher = CustomUser.objects.create_user('teacher1', 'teacher1@school.com', 'password123', role='TEACHER')

    print(f"Assigning subjects to {teacher.username} ({teacher.role})")

    # 3. Create Allocations (JSS 1)
    alloc1, created = SubjectAllocation.objects.get_or_create(
        subject=maths,
        class_grade=Student.ClassGrade.JSS_1,
        session='2025/2026',
        defaults={'teacher': teacher}
    )
    
    alloc2, created = SubjectAllocation.objects.get_or_create(
        subject=english,
        class_grade=Student.ClassGrade.JSS_1,
        session='2025/2026',
        defaults={'teacher': teacher}
    )

    print(f"Allocations created: {SubjectAllocation.objects.count()}")

if __name__ == '__main__':
    run()
