from django.db import models
from django.conf import settings
from students.models import Student
from simple_history.models import HistoricalRecords

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
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
    grade = models.CharField(max_length=2, blank=True, editable=False)
    remark = models.CharField(max_length=50, blank=True) # Check: Made editable for manual override
    
    term = models.CharField(max_length=20, default='1st Term')
    session = models.CharField(max_length=20, default='2025/2026')
    
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    history = HistoricalRecords()

    class Meta:
        unique_together = ('student', 'allocation', 'term', 'session')

    def save(self, *args, **kwargs):
        # Auto-calculate total
        self.total_score = float(self.test_score) + float(self.assignment_score) + float(self.midterm_score) + float(self.exam_score)
        
        # Auto-grade using GradingScale if available
        # Find the matching scale
        scale = GradingScale.objects.filter(
            min_score__lte=self.total_score,
            max_score__gte=self.total_score
        ).first()

        if scale:
            self.grade = scale.grade
            if not self.remark: self.remark = scale.remark
        else:
            # Fallback if no scale covers this score (e.g. out of range or no scales defined)
            if self.total_score >= 70:
                self.grade = 'A'
                if not self.remark: self.remark = 'EXCELLENT'
            elif self.total_score >= 60:
                self.grade = 'B'
                if not self.remark: self.remark = 'VERY GOOD'
            elif self.total_score >= 50:
                self.grade = 'C'
                if not self.remark: self.remark = 'GOOD'
            elif self.total_score >= 45:
                self.grade = 'D'
                if not self.remark: self.remark = 'FAIR'
            elif self.total_score >= 40:
                self.grade = 'E'
                if not self.remark: self.remark = 'POOR'
            else:
                self.grade = 'F'
                if not self.remark: self.remark = 'FAIL'
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} - {self.allocation.subject} ({self.grade})"

class StudentReport(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='reports')
    session = models.CharField(max_length=20, default='2025/2026')
    term = models.CharField(max_length=20, default='1st Term')
    
    class_teacher_comment = models.TextField(blank=True)
    principal_comment = models.TextField(blank=True)
    
    # JSON fields to store traits flexibly
    # Format: {"Punctuality": 5, "Neatness": 4}
    affective_domain = models.JSONField(default=dict, blank=True)
    psychomotor_domain = models.JSONField(default=dict, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('student', 'session', 'term')

