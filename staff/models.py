from django.db import models
from core.models import CustomUser

class StaffProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='staff_profile')
    bio = models.TextField(blank=True, null=True)
    qualifications = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    joining_date = models.DateField(auto_now_add=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    
    def __str__(self):
        return f"Profile of {self.user.username}"

class StaffAttendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'PRESENT', 'Present'
        ABSENT = 'ABSENT', 'Absent'
        LATE = 'LATE', 'Late'
        ON_LEAVE = 'ON_LEAVE', 'On Leave'

    staff = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PRESENT)
    clock_in = models.TimeField(null=True, blank=True)
    clock_out = models.TimeField(null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('staff', 'date')
        verbose_name_plural = "Staff Attendance"

class LeaveRequest(models.Model):
    class LeaveType(models.TextChoices):
        SICK = 'SICK', 'Sick Leave'
        CASUAL = 'CASUAL', 'Casual Leave'
        ANNUAL = 'ANNUAL', 'Annual Leave'
        MATERNITY = 'MATERNITY', 'Maternity Leave'
        OTHER = 'OTHER', 'Other'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    staff = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='leave_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    leave_type = models.CharField(max_length=20, choices=LeaveType.choices)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    approved_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    created_at = models.DateTimeField(auto_now_add=True)

class StaffEvaluation(models.Model):
    staff = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='evaluations')
    evaluator = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='conducted_evaluations')
    date = models.DateField()
    score = models.IntegerField(help_text="Score out of 100")
    comments = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class StaffDocument(models.Model):
    staff = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='staff_documents/')
    document_type = models.CharField(max_length=100, blank=True)
    upload_date = models.DateTimeField(auto_now_add=True)

class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

class CalendarEvent(models.Model):
    class Category(models.TextChoices):
        ACADEMIC = 'ACADEMIC', 'Academic'
        HOLIDAY = 'HOLIDAY', 'Holiday'
        STAFF_MEETING = 'STAFF_MEETING', 'Staff Meeting'
        EXTRACURRICULAR = 'EXTRACURRICULAR', 'Extracurricular'
        OTHER = 'OTHER', 'Other'

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.ACADEMIC)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.title

class ExtracurricularActivity(models.Model):
    class Category(models.TextChoices):
        SPORTS = 'SPORTS', 'Sports'
        ARTS = 'ARTS', 'Arts & Culture'
        ACADEMIC = 'ACADEMIC', 'Academic Club'
        COMMUNITY = 'COMMUNITY', 'Community Service'
        OTHER = 'OTHER', 'Other'

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.category})"

class ExtracurricularRole(models.Model):
    activity = models.ForeignKey(ExtracurricularActivity, on_delete=models.CASCADE, related_name='teacher_roles')
    teacher = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='extracurricular_roles')
    role_description = models.CharField(max_length=255, help_text="e.g., Coach, Patron, Facilitator")
    
    def __str__(self):
        return f"{self.teacher.username} - {self.activity.name} ({self.role_description})"
