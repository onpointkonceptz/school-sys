from django.db import models
from django.conf import settings
from students.models import Student
from simple_history.models import HistoricalRecords

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class GradingScale(models.Model):
    min_score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=2)
    remark = models.CharField(max_length=50)
    
    def __str__(self):
        return f"{self.grade} ({self.min_score}-{self.max_score})"

    class Meta:
        ordering = ['-min_score']

class SubjectAllocation(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, limit_choices_to={'role': 'TEACHER'})
    class_grade = models.CharField(max_length=20, choices=Student.ClassGrade.choices)
    session = models.CharField(max_length=20, default='2025/2026')
    
    unique_together = ('subject', 'class_grade', 'session')

    def __str__(self):
        teacher_name = self.teacher.username if self.teacher else "Unassigned"
        return f"{self.subject} - {self.class_grade} ({teacher_name})"

class GradeRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    allocation = models.ForeignKey(SubjectAllocation, on_delete=models.CASCADE)
    
    # Scores
    test_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, verbose_name="Test (20)")
    assignment_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, verbose_name="Assign (10)")
    midterm_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, verbose_name="Mid-Term (20)")
    exam_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, verbose_name="Exam (50)")
    
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, editable=False)
    grade = models.CharField(max_length=2, blank=True) # Now editable
    remark = models.CharField(max_length=50, blank=True)
    
    term = models.CharField(max_length=20, default='1st Term')
    session = models.CharField(max_length=20, default='2025/2026')
    
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    history = HistoricalRecords()

    @property
    def ca_score(self):
        return float(self.test_score) + float(self.assignment_score) + float(self.midterm_score)

    class Meta:
        unique_together = ('student', 'allocation', 'term', 'session')

    def save(self, *args, **kwargs):
        # Auto-calculate total
        self.total_score = float(self.test_score) + float(self.assignment_score) + float(self.midterm_score) + float(self.exam_score)
        
        # Determine if we should auto-calculate the grade
        # Only auto-calculate if grade is not manually provided or if it's the first save
        should_auto_grade = not self.grade or self.pk is None
        
        if should_auto_grade:
            # Auto-grade using GradingScale if available
            scale = GradingScale.objects.filter(
                min_score__lte=self.total_score,
                max_score__gte=self.total_score
            ).first()

            if scale:
                self.grade = scale.grade
                if not self.remark: self.remark = scale.remark
            else:
                # Fallback logic
                if self.total_score >= 70: self.grade, r = 'A', 'EXCELLENT'
                elif self.total_score >= 60: self.grade, r = 'B', 'VERY GOOD'
                elif self.total_score >= 50: self.grade, r = 'C', 'GOOD'
                elif self.total_score >= 45: self.grade, r = 'D', 'FAIR'
                elif self.total_score >= 40: self.grade, r = 'E', 'POOR'
                else: self.grade, r = 'F', 'FAIL'
                
                if not self.remark: self.remark = r
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} - {self.allocation.subject} ({self.grade})"

class StudentReport(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='reports')
    session = models.CharField(max_length=20, default='2025/2026')
    term = models.CharField(max_length=20, default='1st Term')
    
    class_teacher_comment = models.TextField(blank=True)
    principal_comment = models.TextField(blank=True)
    
    affective_domain = models.JSONField(default=dict, blank=True)
    psychomotor_domain = models.JSONField(default=dict, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('student', 'session', 'term')

class LessonPlan(models.Model):
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_plans')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    class_grade = models.CharField(max_length=20, choices=Student.ClassGrade.choices)
    
    title = models.CharField(max_length=255)
    objectives = models.TextField()
    materials = models.TextField(blank=True)
    activities = models.TextField(blank=True)
    assessment_methods = models.TextField(blank=True)
    
    date = models.DateField()
    support_file = models.FileField(upload_to='lesson_plans/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.title} - {self.subject} ({self.class_grade})"

class TimetableEntry(models.Model):
    class DayOfWeek(models.TextChoices):
        MONDAY = 'MONDAY', 'Monday'
        TUESDAY = 'TUESDAY', 'Tuesday'
        WEDNESDAY = 'WEDNESDAY', 'Wednesday'
        THURSDAY = 'THURSDAY', 'Thursday'
        FRIDAY = 'FRIDAY', 'Friday'
        SATURDAY = 'SATURDAY', 'Saturday'
        SUNDAY = 'SUNDAY', 'Sunday'

    class_grade = models.CharField(max_length=20, choices=Student.ClassGrade.choices)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, limit_choices_to={'role': 'TEACHER'})
    
    day_of_week = models.CharField(max_length=15, choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room_number = models.CharField(max_length=50, blank=True)
    
    session = models.CharField(max_length=20, default='2025/2026')
    term = models.CharField(max_length=20, default='1st Term')

    class Meta:
        verbose_name_plural = "Timetable Entries"
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.class_grade} - {self.subject} ({self.day_of_week})"


class StudentAttendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'PRESENT', 'Present'
        ABSENT = 'ABSENT', 'Absent'
        LATE = 'LATE', 'Late'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PRESENT)
    remarks = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        unique_together = ('student', 'date')
        verbose_name_plural = "Student Attendance"
        ordering = ['-date', 'student__last_name']

    def __str__(self):
        return f"{self.student} - {self.date} ({self.status})"
