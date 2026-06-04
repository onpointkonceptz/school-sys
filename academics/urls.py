from django.urls import path
from . import api

urlpatterns = [
    path('subjects/', api.get_subjects, name='get_subjects'),
    path('subjects/save/', api.save_subject, name='save_subject'),
    path('subjects/delete/', api.delete_subject, name='delete_subject'),
    path('assign-subject/', api.assign_subject, name='assign_subject'),
    path('unassign-subject/', api.unassign_subject, name='unassign_subject'),
    path('teacher-classes/', api.get_teacher_classes, name='teacher-classes'),
    path('grading-scales/', api.get_grading_scales, name='grading-scales'),
    path('grading-scales/save/', api.save_grading_scale, name='save_grading_scale'),
    path('grading-scales/delete/', api.delete_grading_scale, name='delete_grading_scale'),
    path('gradebook/', api.get_class_gradebook, name='gradebook'),
    path('save-grades/', api.save_grades, name='save_grades'),
    path('student-report/', api.get_student_report, name='student_report'),
    
    # Lesson Plans
    path('lesson-plans/', api.get_lesson_plans, name='get_lesson_plans'),
    path('lesson-plans/save/', api.save_lesson_plan, name='save_lesson_plan'),
    path('lesson-plans/<int:pk>/delete/', api.delete_lesson_plan, name='delete_lesson_plan'),
    path('lesson-plans/<int:pk>/history/', api.get_lesson_plan_history, name='lesson_plan_history'),
    
    # Timetable
    path('timetable/', api.get_timetable, name='get_timetable'),
    path('timetable/save/', api.save_timetable_entry, name='save_timetable_entry'),
    path('timetable/<int:pk>/delete/', api.delete_timetable_entry, name='delete_timetable_entry'),
    path('report/save/', api.save_student_report, name='save_student_report'),
    path('report/export/', api.export_report_pdf, name='export_pdf'),
]
