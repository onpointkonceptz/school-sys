import sys
import os
import django

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from students.models import Student

def rename_students():
    print("Starting renaming process...")
    students = Student.objects.filter(admission_number__contains='AJEC/')
    count = 0
    for student in students:
        old_number = student.admission_number
        new_number = old_number.replace('AJEC/', 'KADWEL/')
        
        # Check if destination exists to avoid unique constraint error
        if Student.objects.filter(admission_number=new_number).exists():
            print(f"Skipping {old_number} -> {new_number} (Already exists)")
            continue
            
        student.admission_number = new_number
        student.save()
        count += 1
        print(f"Renamed: {old_number} -> {new_number}")
    
    print(f"Renamed {count} students.")

if __name__ == "__main__":
    rename_students()
