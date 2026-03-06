import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounting.models import FeeStructure
from students.models import Student

def create_fees():
    print("Populating Fee Structures...")
    
    # Defaults
    session = '2025/2026'
    term = '1st Term'
    
    # 1. General Tuition (Day Students)
    # JSS
    FeeStructure.objects.get_or_create(
        name='JSS Tuition (Day)',
        defaults={
            'amount': Decimal('85000.00'),
            'class_grade': None, # Applies to generic unless specific
            'student_type': Student.StudentType.DAY,
            'term': term, 'session': session
        }
    )
    
    # SS
    FeeStructure.objects.get_or_create(
        name='SS Tuition (Day)',
        defaults={
            'amount': Decimal('95000.00'),
            'student_type': Student.StudentType.DAY,
            'term': term, 'session': session
        }
    )
    
    # Boarding Fee (All Classes)
    FeeStructure.objects.get_or_create(
        name='Boarding Fee',
        defaults={
            'amount': Decimal('150000.00'),
            'student_type': Student.StudentType.BOARDING,
            'term': term, 'session': session
        }
    )
    
    # New Student Acceptance Fee
    FeeStructure.objects.get_or_create(
        name='Acceptance Fee',
        defaults={
            'amount': Decimal('20000.00'),
            'student_status': Student.StudentStatus.NEW,
            'term': term, 'session': session
        }
    )
    
    # Uniforms (New Students)
    FeeStructure.objects.get_or_create(
        name='School Uniforms',
        defaults={
            'amount': Decimal('35000.00'),
            'student_status': Student.StudentStatus.NEW,
            'term': term, 'session': session
        }
    )

    print("Fee Structures Created!")

if __name__ == '__main__':
    create_fees()
