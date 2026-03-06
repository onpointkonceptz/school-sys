from django.contrib import admin
from .models import Subject, GradingScale, SubjectAllocation, GradeRecord


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(GradingScale)
class GradingScaleAdmin(admin.ModelAdmin):
    list_display = ('grade', 'min_score', 'max_score', 'remark')
    ordering = ('-min_score',)


@admin.register(SubjectAllocation)
class SubjectAllocationAdmin(admin.ModelAdmin):
    list_display = ('subject', 'class_grade', 'teacher', 'session')
    list_filter = ('class_grade', 'session')
    search_fields = ('subject__name', 'teacher__username', 'class_grade')
    ordering = ('class_grade', 'subject__name')


@admin.register(GradeRecord)
class GradeRecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'allocation', 'total_score', 'grade', 'remark', 'session', 'term', 'recorded_by')
    list_filter = ('grade', 'session', 'term', 'allocation__class_grade')
    search_fields = ('student__first_name', 'student__last_name', 'student__admission_number')
    ordering = ('-session', 'student__last_name')
    raw_id_fields = ('student', 'allocation')
