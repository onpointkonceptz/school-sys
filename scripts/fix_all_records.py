import sys
import os
import django

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from students.models import Student
from academics.models import SubjectAllocation, GradeRecord
from accounting.models import StudentFee, FeeStructure

def normalize_data():
    print("Starting Comprehensive Data Normalization...")
    
    # Mapping for common inconsistencies
    class_map = {
        'Nursery 1': 'NURSERY_1', 'Nursery 2': 'NURSERY_2', 'Nursery 3': 'NURSERY_3',
        'Primary 1': 'PRIMARY_1', 'Primary 2': 'PRIMARY_2', 'Primary 3': 'PRIMARY_3',
        'Primary 4': 'PRIMARY_4', 'Primary 5': 'PRIMARY_5', 'Primary 6': 'PRIMARY_6',
        'JSS 1': 'JSS_1', 'JSS 2': 'JSS_2', 'JSS 3': 'JSS_3',
        'SS 1': 'SS_1', 'SS 2': 'SS_2', 'SS 3': 'SS_3',
        'SSS 1': 'SS_1', 'SSS 2': 'SS_2', 'SSS 3': 'SS_3',
        'SSS_1': 'SS_1', 'SSS_2': 'SS_2', 'SSS_3': 'SS_3',
    }

    # 1. Normalize Class Grades in Students
    s_fix = 0
    for s in Student.objects.all():
        old_grade = s.class_grade
        if old_grade in class_map:
            s.class_grade = class_map[old_grade]
            s.save()
            s_fix += 1
            print(f"  Fixed Student {s.admission_number}: {old_grade} -> {s.class_grade}")

    # 2. Normalize Class Grades in Allocations
    a_fix = 0
    for a in SubjectAllocation.objects.all():
        old_grade = a.class_grade
        if old_grade in class_map:
            a.class_grade = class_map[old_grade]
            a.save()
            a_fix += 1
            print(f"  Fixed Allocation {a.id}: {old_grade} -> {a.class_grade}")

    # 3. Normalize Class Grades in FeeStructures
    f_fix = 0
    for f in FeeStructure.objects.all():
        old_grade = f.class_grade
        if old_grade in class_map:
            f.class_grade = class_map[old_grade]
            f.save()
            f_fix += 1
            print(f"  Fixed FeeStructure {f.id}: {old_grade} -> {f.class_grade}")

    # 4. Normalize Admission Numbers (Prefix to KADWEL/)
    r_fix = 0
    for s in Student.objects.all():
        if not s.admission_number.startswith('KADWEL/'):
            # Detect existing prefix (usually splits by /)
            parts = s.admission_number.split('/')
            if len(parts) > 1:
                # Replace the first part (prefix) with KADWEL
                new_number = f"KADWEL/{'/'.join(parts[1:])}"
            else:
                # No slash, just prepend KADWEL/
                new_number = f"KADWEL/{s.admission_number}"
            
            # Check for conflict
            if Student.objects.filter(admission_number=new_number).exists():
                print(f"  CONFLICT: {s.admission_number} -> {new_number} EXISTS. Appending ID.")
                new_number = f"{new_number}-{s.id}"

            old_number = s.admission_number
            s.admission_number = new_number
            s.save()
            r_fix += 1
            print(f"  Renamed: {old_number} -> {new_number}")

    print(f"\nNormalization Complete!")
    print(f"Fixed {s_fix} Student class grades.")
    print(f"Fixed {a_fix} Allocation class grades.")
    print(f"Fixed {f_fix} FeeStructure class grades.")
    print(f"Renamed {r_fix} Students to KADWEL/ prefix.")

if __name__ == "__main__":
    normalize_data()
