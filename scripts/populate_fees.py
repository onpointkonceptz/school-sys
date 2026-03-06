from accounting.models import FeeStructure, StudentFee
from students.models import Student

def run():
    print("Starting Fee Structure Population...")
    
    # 1. Create Default Tuition Fee for all classes (100,000)
    # We do this for each class to allow future customization per class
    count = 0
    for code, label in Student.ClassGrade.choices:
        fee, created = FeeStructure.objects.get_or_create(
            name="Tuition Fee",
            class_grade=code,
            term="1st Term",
            session="2025/2026",
            defaults={
                'amount': 100000.00,
                'student_status': None, # Applies to all statuses
                'student_type': None    # Applies to all types
            }
        )
        if created:
            count += 1
            print(f"Created Tuition Fee for {label}")
        else:
            print(f"Fee exists for {label}")

    print(f"Created {count} Fee Structures.")

    # 2. Recalculate Student Fees
    print("\nRecalculating Student Fees...")
    updated_count = 0
    
    student_fees = StudentFee.objects.all()
    for sf in student_fees:
        student = sf.student
        
        # Find matching fees
        applicable_fees = FeeStructure.objects.filter(
            class_grade__in=[student.class_grade, None, ''],
            student_status__in=[student.student_status, None, ''],
            student_type__in=[student.student_type, None, ''],
            term=sf.term,
            session=sf.session
        )
        
        total_payable = sum(f.amount for f in applicable_fees)
        
        # Update record
        sf.total_amount_payable = total_payable
        
        # Update fully paid status
        if sf.amount_paid >= sf.total_amount_payable and sf.total_amount_payable > 0:
            sf.is_fully_paid = True
        else:
            sf.is_fully_paid = False
            
        sf.save()
        updated_count += 1
        print(f"Updated {student.admission_number}: Payable={total_payable}, Paid={sf.amount_paid}, Bal={sf.outstanding_balance}")

    print(f"\nSuccessfully updated {updated_count} StudentFee records.")
