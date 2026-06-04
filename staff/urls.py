from django.urls import path
from . import api

urlpatterns = [
    # Staff Profiles
    path('list/', api.get_staff_list, name='get_staff_list'),
    path('profile/update/', api.update_staff_profile, name='update_staff_profile'),
    
    # Attendance
    path('attendance/', api.get_attendance, name='get_attendance'),
    path('attendance/record/', api.record_attendance, name='record_attendance'),
    
    # Leave Requests
    path('leave/requests/', api.get_leave_requests, name='get_leave_requests'),
    path('leave/submit/', api.submit_leave_request, name='submit_leave_request'),
    path('leave/approve/', api.approve_leave_request, name='approve_leave_request'),
    
    # Evaluations
    path('evaluations/', api.get_evaluations, name='get_evaluations'),
    
    # Announcements
    path('announcements/', api.get_announcements, name='get_announcements'),
    path('announcements/create/', api.create_announcement, name='create_announcement'),
    
    # Calendar
    path('calendar/', api.get_calendar_events, name='get_calendar_events'),
    
    # Central Management
    path('manage/details/<int:user_id>/', api.get_staff_management_detail, name='staff_management_detail'),
    path('manage/status-toggle/', api.toggle_staff_status, name='toggle_staff_status'),
    path('manage/document-upload/', api.upload_staff_document, name='upload_staff_document'),
]
