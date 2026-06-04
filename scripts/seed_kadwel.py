import os
import django
import random
from datetime import date, timedelta
import uuid
import sys

# Setup Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction
from students.models import Student
from academics.models import Subject, SubjectAllocation, GradeRecord, GradingScale
from accounting.models import StudentFee, Transaction
from core.models import CustomUser

def seed():
    with transaction.atomic():
        # 1. Clear existing generated data for a clean state (Optional but good for seeding)
        # Student.objects.all().delete()
        # SubjectAllocation.objects.all().delete()
        # GradeRecord.objects.all().delete()
        # StudentFee.objects.all().delete()
        # Transaction.objects.all().delete()

        # 2. Ensure Teachers & Admin
        admin = CustomUser.objects.filter(role='SUPER_ADMIN').first()
        teacher1, _ = CustomUser.objects.get_or_create(
            username='teacher1', 
            defaults={'first_name': 'Babatunde', 'last_name': 'Ojo', 'role': 'TEACHER'}
        )
        if not teacher1.password:
            teacher1.set_password('password123')
            teacher1.save()

        # 3. Subjects
        subject_list = [
            ('Mathematics', 'MTH'), ('English Language', 'ENG'), ('Physics', 'PHY'),
            ('Chemistry', 'CHM'), ('Biology', 'BIO'), ('Economics', 'ECN'),
            ('Government', 'GOV'), ('Literature in English', 'LIT'), ('Geography', 'GEO'),
            ('Agricultural Science', 'AGR'), ('Further Mathematics', 'FMA'), ('Commerce', 'COM'),
            ('Civic Education', 'CIV'), ('Christian Religious Studies', 'CRS'), ('Islamic Religious Studies', 'IRS'),
            ('Fine Arts', 'ART'), ('Basic Science', 'BSC'), ('Basic Technology', 'BTEC'),
            ('Data Processing', 'DPR'), ('Physical & Health Education', 'PHE')
        ]
        
        subjects = []
        for name, code in subject_list:
            sub, _ = Subject.objects.get_or_create(name=name, defaults={'code': code})
            subjects.append(sub)

        # 4. Grading Scales
        scales = [
            (70, 100, 'A', 'EXCELLENT'), (60, 69, 'B', 'VERY GOOD'),
            (50, 59, 'C', 'CREDIT'), (45, 49, 'D', 'PASS'),
            (40, 44, 'E', 'POOR'), (0, 39, 'F', 'FAIL')
        ]
        for mn, mx, g, r in scales:
            GradingScale.objects.update_or_create(grade=g, defaults={'min_score': mn, 'max_score': mx, 'remark': r})

        # 5. Data Lists
        all_classes = [c[0] for c in Student.ClassGrade.choices]
        first_names = ["Abiola", "Babatunde", "Chika", "Damilola", "Efe", "Femi", "Gozie", "Hassan", "Ibrahim", "Jide", 
                       "Kassim", "Ladi", "Musa", "Nneka", "Oluwaseun", "Philomena", "Quincy", "Rotimi", "Sade", "Tayo",
                       "Uche", "Victor", "Wole", "Yemi", "Zainab", "Adaeze", "Bisi", "Chioma", "Dayo", "Ebele"]
        last_names = ["Okoro", "Abubakar", "Balogun", "Adeyemi", "Eze", "Obi", "Danjuma", "Igwe", "Salami", "Ojo",
                      "Musa", "Aliyu", "Oni", "Olatunji", "Ige", "Bello", "Okonkwo", "Nwachukwu", "Umar", "Garba"]

        session = '2025/2026'
        term = '1st Term'

        print(f"Seeding {len(all_classes)} classes x 50 students...")

        for class_code in all_classes:
            print(f"Processing {class_code}...")
            
            # Ensure Allocations
            selected_subs = random.sample(subjects, 12)
            allocs = []
            for sub in selected_subs:
                alloc, _ = SubjectAllocation.objects.get_or_create(
                    subject=sub, class_grade=class_code, session=session, defaults={'teacher': teacher1}
                )
                allocs.append(alloc)

            for i in range(50):
                student = Student.objects.create(
                    first_name=random.choice(first_names),
                    last_name=random.choice(last_names),
                    gender=random.choice(['MALE', 'FEMALE']),
                    date_of_birth=date(2025 - (3 + all_classes.index(class_code)), random.randint(1,12), random.randint(1,28)),
                    class_grade=class_code,
                    current_session=session,
                    current_term=term,
                    student_status='ACTIVE',
                    admission_number=f"KADWEL/{class_code}/{random.randint(1000, 9999)}/{i}"
                )

                # Grades (Bulk record creation for this student)
                grade_objs = []
                for alloc in allocs[:10]:
                    perf = random.random()
                    if perf > 0.85:   t, a, m, e = random.randint(16,20), random.randint(8,10), random.randint(16,20), random.randint(40,50)
                    elif perf > 0.5:  t, a, m, e = random.randint(11,15), random.randint(6,8), random.randint(11,15), random.randint(28,39)
                    elif perf > 0.2:  t, a, m, e = random.randint(8,11), random.randint(4,6), random.randint(8,11), random.randint(20,27)
                    else:             t, a, m, e = random.randint(0,7), random.randint(0,4), random.randint(0,7), random.randint(0,19)

                    # Model .save() handles total calculation and grading usually,
                    # but since we want speed, we use create() which calls .save()
                    # or better: use GradeRecord objects and bulk_create.
                    # GradeRecord model's save() is complex, so multiple creates is fine INSIDE atomic block.
                    GradeRecord.objects.create(
                        student=student, allocation=alloc, session=session, term=term,
                        test_score=t, assignment_score=a, midterm_score=m, exam_score=e
                    )

                # Fees
                total_fee = random.choice([45000, 60000, 85000, 120000])
                status_rand = random.random()
                paid = total_fee if status_rand > 0.4 else (random.randint(5000, total_fee - 1000) if status_rand > 0.15 else 0)
                
                StudentFee.objects.create(
                    student=student, session=session, term=term,
                    total_amount_payable=total_fee, amount_paid=paid,
                    is_fully_paid=(paid == total_fee)
                )

                if paid > 0:
                    Transaction.objects.create(
                        student=student, amount_paid=paid, reference_number=f"TRX-{uuid.uuid4().hex[:8].upper()}",
                        payment_method=random.choice(['CASH', 'BANK_TRANSFER', 'POS']),
                        payment_type='TUITION', session=session, term=term, received_by=admin or teacher1
                    )

    print("Seed data generation complete.")

if __name__ == '__main__':
    seed()
