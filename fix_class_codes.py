import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from students.models import Student
from academics.models import SubjectAllocation

def run():
    # Update Students
    s_count = Student.objects.filter(class_grade__startswith='SSS_').update(
        class_grade=django.db.models.functions.Replace('class_grade', django.db.models.Value('SSS_'), django.db.models.Value('SS_'))
    )
    # Since replace isn't always direct, let's lookloop
    count = 0
    for s in Student.objects.filter(class_grade__startswith='SSS_'):
        new_code = s.class_grade.replace('SSS_', 'SS_')
        s.class_grade = new_code
        s.save()
        count += 1
    print(f"Fixed {count} Students with bad codes.")

    # Update Allocations
    acount = 0
    for a in SubjectAllocation.objects.filter(class_grade__startswith='SSS_'):
        new_code = a.class_grade.replace('SSS_', 'SS_')
        a.class_grade = new_code
        a.save()
        acount += 1
    print(f"Fixed {acount} Allocations with bad codes.")

if __name__ == '__main__':
    run()
