import os
import django
import random
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from students.models import Student
from academics.models import Subject, SubjectAllocation
from core.models import CustomUser

def run():
    teacher = CustomUser.objects.filter(role='TEACHER').first()
    if not teacher:
        print("No Teacher found.")
        return

    # Subjects to add if not exist
    subjects = ['Mathematics', 'English Language', 'Basic Science', 'Social Studies']
    
    # Classes to populate
    classes = [
        ('JSS_2', 'JSS 2'),
        ('JSS_3', 'JSS 3'),
        ('SSS_1', 'SSS 1'),
        ('SSS_2', 'SSS 2'),
        ('SSS_3', 'SSS 3')
    ]

    print("--- Seeding Additional Classes ---")

    for code, label in classes:
        print(f"\nProcessing {label}...")
        
        # 1. Create Students
        if not Student.objects.filter(class_grade=code).exists():
            for i in range(3): # Add 3 students per class
                s = Student.objects.create(
                    first_name=f"Student{i+1}",
                    last_name=f"{code}",
                    admission_number=f"{code}/{2025}/{i+1:03d}",
                    class_grade=code,
                    student_type=random.choice(['DAY', 'BOARDING']),
                    student_status='ACTIVE',
                    date_of_birth=date(2010, 1, 1),
                    gender='MALE' if i % 2 == 0 else 'FEMALE',
                    parent_phone='08012345678'
                )
                print(f"  Created Student: {s.first_name} {s.last_name}")
        else:
            print(f"  Students already exist in {label}")

        # 2. Create Allocations (Assign to Teacher)
        for subj_name in subjects:
            subj, _ = Subject.objects.get_or_create(name=subj_name)
            
            if not SubjectAllocation.objects.filter(class_grade=code, subject=subj).exists():
                SubjectAllocation.objects.create(
                    class_grade=code,
                    subject=subj,
                    teacher=teacher
                )
                print(f"  Allocated {subj.name} to {teacher.username}")
            else:
                print(f"  Allocation for {subj.name} already exists")

    print("\nDone. Teacher should now see more classes.")

if __name__ == '__main__':
    run()
