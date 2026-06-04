import os
import sys
import django
from django.db import transaction

# Setup Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from students.models import Student

def rename_to_kadwel():
    print("Starting database migration to KADWEL prefix...")
    
    with transaction.atomic():
        students = Student.objects.all()
        total = students.count()
        renamed_ajec = 0
        renamed_aj = 0
        no_change = 0
        
        for student in students:
            old_number = student.admission_number
            new_number = old_number
            
            if old_number.startswith('AJEC/'):
                new_number = old_number.replace('AJEC/', 'KADWEL/', 1)
                renamed_ajec += 1
            elif old_number.startswith('AJ/'):
                new_number = old_number.replace('AJ/', 'KADWEL/', 1)
                renamed_aj += 1
            else:
                no_change += 1
                continue
                
            # Avoid unique constraints violation
            if Student.objects.filter(admission_number=new_number).exclude(id=student.id).exists():
                print(f"  Warning: Conflict detected for {old_number} -> {new_number}. Appending student ID.")
                new_number = f"{new_number}-{student.id}"
                
            student.admission_number = new_number
            student.save()
            
            if (renamed_ajec + renamed_aj) % 100 == 0:
                print(f"  Processed {renamed_ajec + renamed_aj} students...")
                
        print(f"\nMigration Completed Successfully:")
        print(f"  Total Students checked: {total}")
        print(f"  Renamed with AJEC/ prefix: {renamed_ajec}")
        print(f"  Renamed with AJ/ prefix: {renamed_aj}")
        print(f"  No change required (already correct or other prefix): {no_change}")

if __name__ == "__main__":
    rename_to_kadwel()
