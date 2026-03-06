
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from academics.models import GradingScale

def seed_scales():
    scales = [
        {'min': 70, 'max': 100, 'grade': 'A', 'remark': 'EXCELLENT'},
        {'min': 60, 'max': 69.99, 'grade': 'B', 'remark': 'VERY GOOD'},
        {'min': 50, 'max': 59.99, 'grade': 'C', 'remark': 'GOOD'},
        {'min': 45, 'max': 49.99, 'grade': 'D', 'remark': 'FAIR'},
        {'min': 40, 'max': 44.99, 'grade': 'E', 'remark': 'POOR'},
        {'min': 0, 'max': 39.99, 'grade': 'F', 'remark': 'FAIL'},
    ]
    
    print("Seeding Grading Scales...")
    for s in scales:
        obj, created = GradingScale.objects.get_or_create(
            grade=s['grade'],
            defaults={
                'min_score': s['min'],
                'max_score': s['max'],
                'remark': s['remark']
            }
        )
        if created:
            print(f"Created Scale: {s['grade']}")
        else:
            # Update existing to match standard
            obj.min_score = s['min']
            obj.max_score = s['max']
            obj.remark = s['remark']
            obj.save()
            print(f"Updated Scale: {s['grade']}")
            
if __name__ == "__main__":
    seed_scales()
