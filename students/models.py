from django.db import models
from simple_history.models import HistoricalRecords
import datetime

class Student(models.Model):
    class ClassGrade(models.TextChoices):
        DAY_CARE = 'DAY_CARE', 'Day Care'
        NURSERY_1 = 'NURSERY_1', 'Nursery 1'
        NURSERY_2 = 'NURSERY_2', 'Nursery 2'
        NURSERY_3 = 'NURSERY_3', 'Nursery 3'
        PRIMARY_1 = 'PRIMARY_1', 'Primary 1'
        PRIMARY_2 = 'PRIMARY_2', 'Primary 2'
        PRIMARY_3 = 'PRIMARY_3', 'Primary 3'
        PRIMARY_4 = 'PRIMARY_4', 'Primary 4'
        PRIMARY_5 = 'PRIMARY_5', 'Primary 5'
        PRIMARY_6 = 'PRIMARY_6', 'Primary 6'
        JSS_1 = 'JSS_1', 'JSS 1'
        JSS_2 = 'JSS_2', 'JSS 2'
        JSS_3 = 'JSS_3', 'JSS 3'
        SS_1 = 'SS_1', 'SS 1'
        SS_2 = 'SS_2', 'SS 2'
        SS_3 = 'SS_3', 'SS 3'
        SIXTH_FORM = 'SIXTH_FORM', 'Sixth Form'

    class StudentStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        GRADUATED = 'GRADUATED', 'Graduated'
        WITHDRAWN = 'WITHDRAWN', 'Withdrawn'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        TRANSFERRED = 'TRANSFERRED', 'Transferred'
        # Keep NEW/RETURNING for admission context if needed, or map them to ACTIVE
        NEW = 'NEW', 'New Admission' 
        RETURNING = 'RETURNING', 'Returning'

    class StudentType(models.TextChoices):
        DAY = 'DAY', 'Day Student'
        BOARDING = 'BOARDING', 'Boarding Student'

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    admission_number = models.CharField(max_length=20, unique=True, blank=True)
    
    class_grade = models.CharField(max_length=20, choices=ClassGrade.choices)
    student_status = models.CharField(max_length=20, choices=StudentStatus.choices, default=StudentStatus.ACTIVE)
    student_type = models.CharField(max_length=20, choices=StudentType.choices, default=StudentType.DAY)
    
    # Session Info
    current_term = models.CharField(max_length=20, default='1st Term')
    current_session = models.CharField(max_length=20, default='2025/2026')
    
    # --- Bio Data ---
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('MALE', 'Male'), ('FEMALE', 'Female')], default='MALE')
    nationality = models.CharField(max_length=50, default='Nigerian')
    state_of_origin = models.CharField(max_length=50, blank=True)
    lga = models.CharField(max_length=50, blank=True, verbose_name="LGA")
    religion = models.CharField(max_length=50, blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    medical_conditions = models.TextField(blank=True, help_text="Allergies, etc.")
    special_needs = models.TextField(blank=True)
    previous_school = models.CharField(max_length=200, blank=True)
    date_of_admission = models.DateField(default=datetime.date.today)
    passport_photo = models.ImageField(upload_to='student_passports/', null=True, blank=True)

    # --- Father ---
    father_name = models.CharField(max_length=100, blank=True)
    father_phone = models.CharField(max_length=20, blank=True)
    father_occupation = models.CharField(max_length=100, blank=True)

    # --- Mother ---
    mother_name = models.CharField(max_length=100, blank=True)
    mother_phone = models.CharField(max_length=20, blank=True)
    mother_occupation = models.CharField(max_length=100, blank=True)

    # --- Guardian (Primary Contact) ---
    parent_name = models.CharField(max_length=100, blank=True, verbose_name="Primary Guardian Name")
    parent_phone = models.CharField(max_length=20, blank=True, verbose_name="Guardian Phone")
    parent_email = models.EmailField(blank=True)
    parent_address = models.TextField(blank=True, verbose_name="Home Address")
    relationship_to_student = models.CharField(max_length=50, blank=True)
    
    # --- Emergency ---
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

    # Legacy field support (can be removed later if we migrate fully)
    is_boarding = models.BooleanField(default=False, editable=False) 

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    history = HistoricalRecords()

    def save(self, *args, **kwargs):
        # Auto-sync legacy field
        self.is_boarding = (self.student_type == self.StudentType.BOARDING)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number})"

    class Meta:
        ordering = ['class_grade', 'last_name']


class StudentAcademicHistory(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='academic_history')
    academic_session = models.CharField(max_length=20)
    class_grade = models.CharField(max_length=20, choices=Student.ClassGrade.choices)
    student_status = models.CharField(max_length=20, choices=Student.StudentStatus.choices)
    promotion_date = models.DateField(auto_now_add=True)
    comments = models.TextField(blank=True)

    class Meta:
        ordering = ['-academic_session']
        verbose_name_plural = "Student Academic History"
