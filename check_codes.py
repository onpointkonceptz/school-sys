import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from students.models import Student
from academics.models import SubjectAllocation

def run():
    print("--- Distinct Student Class Grades ---")
    grades = Student.objects.values_list('class_grade', flat=True).distinct()
    for g in grades:
        print(f"Code: {g} | Count: {Student.objects.filter(class_grade=g).count()}")

    print("\n--- Distinct Allocation Class Grades ---")
    allocs = SubjectAllocation.objects.values_list('class_grade', flat=True).distinct()
    for a in allocs:
        print(f"Code: {a} | Allocated: Yes")

if __name__ == '__main__':
    run()
