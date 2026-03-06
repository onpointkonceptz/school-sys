import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from students.models import Student
from academics.models import SubjectAllocation
from core.models import CustomUser

def run():
    print("--- Student Counts by Class ---")
    for code, label in Student.ClassGrade.choices:
        count = Student.objects.filter(class_grade=code).count()
        if count > 0:
            print(f"{label} ({code}): {count}")

    print("\n--- Teacher Allocations ---")
    teacher = CustomUser.objects.filter(role='TEACHER').first()
    if teacher:
        print(f"Teacher: {teacher.username}")
        allocs = SubjectAllocation.objects.filter(teacher=teacher)
        if allocs.exists():
            for a in allocs:
                print(f"  - {a.subject.name} : {a.class_grade}")
        else:
            print("  No allocations found.")
    else:
        print("No Teacher found.")

if __name__ == '__main__':
    run()
