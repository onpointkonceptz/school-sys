from students.api import dashboard_stats
from rest_framework.test import APIRequestFactory, force_authenticate
from core.models import CustomUser

def run():
    # Check Allocations
    from academics.models import SubjectAllocation
    print(f"\nTotal Allocations: {SubjectAllocation.objects.count()}")
    for alloc in SubjectAllocation.objects.all():
        print(f"  - {alloc.subject} ({alloc.class_grade}) -> {alloc.teacher.username if alloc.teacher else 'None'}")

    factory = APIRequestFactory()
    request = factory.get('/students/dashboard-stats/')
    
    # 1. Test as Admin/Principal (Should see all)
    admin_user = CustomUser.objects.filter(role__in=['PRINCIPAL', 'CHAIRMAN', 'SUPER_ADMIN']).first() or CustomUser.objects.filter(is_superuser=True).first()
    if admin_user:
        print(f"\nTesting as {admin_user.username} ({admin_user.role})")
        force_authenticate(request, user=admin_user)
        response = dashboard_stats(request)
        print(f"Status: {response.status_code}")
        print(f"Data: {len(response.data)} classes found.")
    else:
        print("\nNo Admin/Principal user found.")

    # 2. Test as Teacher (Should see only assigned)
    # Find a teacher WITH allocations first
    teacher_with_alloc = SubjectAllocation.objects.filter(teacher__isnull=False).first()
    if teacher_with_alloc:
        teacher = teacher_with_alloc.teacher
    else:
        teacher = CustomUser.objects.filter(role='TEACHER').first()
        
    if teacher:
        print(f"\nTesting as {teacher.username} ({teacher.role})")
        force_authenticate(request, user=teacher)
        response = dashboard_stats(request)
        print(f"Status: {response.status_code}")
        print(f"Data: {len(response.data)} classes found.")
    else:
        print("\nNo Teacher user found.")

if __name__ == '__main__':
    run()
