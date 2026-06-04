import os
import django
import random
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser
from staff.models import StaffProfile, StaffAttendance, LeaveRequest, Announcement

def seed_staff():
    print("Seeding staff data...")
    
    # 1. Get existing teachers and others
    teachers = CustomUser.objects.filter(role=CustomUser.Role.TEACHER)
    others = CustomUser.objects.exclude(role=CustomUser.Role.TEACHER).exclude(is_superuser=True)
    
    all_staff = list(teachers) + list(others)
    
    for user in all_staff:
        # Create profile if not exists
        StaffProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': f"Dedicated {user.get_role_display()} at Kadwel School.",
                'qualifications': "B.Ed, M.Sc in Education",
                'phone_number': f"080{random.randint(10000000, 99999999)}",
                'address': "123 School Road, Lagos, Nigeria"
            }
        )
        
        # Create some attendance for the last 5 days
        for i in range(5):
            date = datetime.now().date() - timedelta(days=i)
            if date.weekday() < 5: # Monday to Friday
                StaffAttendance.objects.get_or_create(
                    staff=user,
                    date=date,
                    defaults={
                        'status': random.choice(['PRESENT', 'PRESENT', 'PRESENT', 'LATE']),
                        'clock_in': "08:15" if random.random() > 0.8 else "07:45",
                        'clock_out': "16:00"
                    }
                )

    # 2. Create some Leave Requests
    if teachers.exists():
        leave_staff = teachers.first()
        LeaveRequest.objects.get_or_create(
            staff=leave_staff,
            start_date=datetime.now().date() + timedelta(days=10),
            end_date=datetime.now().date() + timedelta(days=15),
            defaults={
                'leave_type': 'CASUAL',
                'reason': 'Family emergency/travel.',
                'status': 'PENDING'
            }
        )

    # 3. Create Announcements
    admin = CustomUser.objects.filter(role=CustomUser.Role.SUPER_ADMIN).first()
    if admin:
        Announcement.objects.get_or_create(
            title="End of Term Meeting",
            content="A mandatory staff meeting will be held this Friday to discuss end of term results.",
            author=admin
        )
        Announcement.objects.get_or_create(
            title="New Staff Portal Live",
            content="We have successfully launched the new Staff Management module. Please update your profiles.",
            author=admin
        )

    print("Staff seeding completed!")

if __name__ == "__main__":
    seed_staff()
