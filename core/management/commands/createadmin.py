from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Create admin and chairman users automatically'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # 1. Superuser/Admin
        username = 'admin'
        email = 'admin@example.com'
        password = 'password123'

        if not User.objects.filter(username=username).exists():
            admin_user = User.objects.create_superuser(username, email, password)
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created successfully."))
        else:
            admin_user = User.objects.get(username=username)
            admin_user.set_password(password)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' password reset successfully."))

        # 2. Chairman User
        chairman_username = 'chairman'
        chairman_email = 'chairman@example.com'
        chairman_password = 'password123'

        if not User.objects.filter(username=chairman_username).exists():
            chairman_user = User.objects.create_user(
                username=chairman_username,
                email=chairman_email,
                password=chairman_password,
                role='CHAIRMAN'
            )
            self.stdout.write(self.style.SUCCESS(f"Chairman user '{chairman_username}' created successfully."))
        else:
            chairman_user = User.objects.get(username=chairman_username)
            chairman_user.set_password(chairman_password)
            chairman_user.role = 'CHAIRMAN'
            chairman_user.save()
            self.stdout.write(self.style.SUCCESS(f"Chairman user '{chairman_username}' password reset successfully."))

        # 3. Ensure profiles exist for admin and chairman
        try:
            from staff.models import StaffProfile
            
            StaffProfile.objects.get_or_create(
                user=admin_user,
                defaults={
                    'bio': "Super Administrator of Kadwel School.",
                    'qualifications': "B.Sc Computer Science",
                    'phone_number': "08000000000",
                    'address': "Admin Office, Kadwel School"
                }
            )
            
            StaffProfile.objects.get_or_create(
                user=chairman_user,
                defaults={
                    'bio': "Chairman of Kadwel School.",
                    'qualifications': "M.B.A, Ph.D",
                    'phone_number': "08012345678",
                    'address': "Chairman's Office, Kadwel School"
                }
            )
            self.stdout.write(self.style.SUCCESS("Staff profiles for admin and chairman checked/created."))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Could not create staff profile: {e}"))

