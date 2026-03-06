from django.contrib import admin
from .models import Student, StudentAcademicHistory


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('admission_number', 'last_name', 'first_name', 'class_grade', 'student_status', 'student_type', 'current_session', 'parent_phone')
    list_filter = ('class_grade', 'student_status', 'student_type', 'current_session', 'current_term', 'gender')
    search_fields = ('first_name', 'last_name', 'admission_number', 'parent_name', 'parent_phone')
    ordering = ('class_grade', 'last_name')
    list_per_page = 50
    fieldsets = (
        ('Basic Info', {
            'fields': ('first_name', 'last_name', 'admission_number', 'date_of_birth', 'gender', 'passport_photo')
        }),
        ('Academic', {
            'fields': ('class_grade', 'student_status', 'student_type', 'current_term', 'current_session', 'date_of_admission', 'previous_school')
        }),
        ('Guardian', {
            'fields': ('parent_name', 'parent_phone', 'parent_email', 'parent_address', 'relationship_to_student')
        }),
        ('Father', {
            'fields': ('father_name', 'father_phone', 'father_occupation'),
            'classes': ('collapse',)
        }),
        ('Mother', {
            'fields': ('mother_name', 'mother_phone', 'mother_occupation'),
            'classes': ('collapse',)
        }),
        ('Emergency', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone'),
            'classes': ('collapse',)
        }),
        ('Bio', {
            'fields': ('nationality', 'state_of_origin', 'lga', 'religion', 'blood_group', 'medical_conditions', 'special_needs'),
            'classes': ('collapse',)
        }),
    )


@admin.register(StudentAcademicHistory)
class StudentAcademicHistoryAdmin(admin.ModelAdmin):
    list_display = ('student', 'class_grade', 'academic_session', 'student_status', 'promotion_date', 'comments')
    list_filter = ('class_grade', 'academic_session', 'student_status')
    search_fields = ('student__first_name', 'student__last_name', 'student__admission_number')
    ordering = ('-promotion_date',)
    raw_id_fields = ('student',)
