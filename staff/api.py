from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import (
    StaffProfile, StaffAttendance, LeaveRequest, StaffEvaluation, 
    StaffDocument, Announcement, CalendarEvent, ExtracurricularActivity, 
    ExtracurricularRole
)
from .serializers import (
    StaffProfileSerializer, StaffAttendanceSerializer, LeaveRequestSerializer,
    StaffEvaluationSerializer, StaffDocumentSerializer, AnnouncementSerializer,
    CalendarEventSerializer, ExtracurricularActivitySerializer, 
    ExtracurricularRoleSerializer
)
from core.models import CustomUser
from .permissions import IsStaffAdmin
from academics.models import SubjectAllocation, TimetableEntry
from academics.serializers import SubjectAllocationSerializer, TimetableEntrySerializer

# --- Staff Profile ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_staff_list(request):
    profiles = StaffProfile.objects.all()
    serializer = StaffProfileSerializer(profiles, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsStaffAdmin])
def update_staff_profile(request):
    """Update or Create a staff profile"""
    data = request.data
    user_id = data.get('user')
    try:
        profile = StaffProfile.objects.get(user_id=user_id)
        serializer = StaffProfileSerializer(profile, data=data, partial=True)
    except StaffProfile.DoesNotExist:
        serializer = StaffProfileSerializer(data=data)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- Attendance ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance(request):
    date = request.query_params.get('date')
    if date:
        records = StaffAttendance.objects.filter(date=date)
    else:
        records = StaffAttendance.objects.all()
    serializer = StaffAttendanceSerializer(records, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsStaffAdmin])
def record_attendance(request):
    data = request.data
    serializer = StaffAttendanceSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- Leave Requests ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leave_requests(request):
    requests = LeaveRequest.objects.all().order_by('-created_at')
    serializer = LeaveRequestSerializer(requests, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_leave_request(request):
    data = request.data
    serializer = LeaveRequestSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsStaffAdmin])
def approve_leave_request(request):
    leave_id = request.data.get('id')
    stat = request.data.get('status')
    try:
        leave = LeaveRequest.objects.get(pk=leave_id)
        leave.status = stat
        leave.approved_by = request.user if request.user.is_authenticated else None
        leave.save()
        return Response({'success': True})
    except LeaveRequest.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

# --- Evaluations ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_evaluations(request):
    evals = StaffEvaluation.objects.all()
    serializer = StaffEvaluationSerializer(evals, many=True)
    return Response(serializer.data)

# --- Announcements ---
@api_view(['GET'])
@permission_classes([AllowAny])
def get_announcements(request):
    notices = Announcement.objects.filter(is_active=True).order_by('-created_at')
    serializer = AnnouncementSerializer(notices, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsStaffAdmin])
def create_announcement(request):
    data = request.data
    serializer = AnnouncementSerializer(data=data)
    if serializer.is_valid():
        serializer.save(author=request.user if request.user.is_authenticated else CustomUser.objects.filter(role='SUPER_ADMIN').first())
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- Calendar ---
@api_view(['GET'])
@permission_classes([AllowAny])
def get_calendar_events(request):
    events = CalendarEvent.objects.all()
    serializer = CalendarEventSerializer(events, many=True)
    return Response(serializer.data)

# --- Extracurricular ---
@api_view(['GET'])
@permission_classes([AllowAny])
def get_extracurricular_activities(request):
    activities = ExtracurricularActivity.objects.all()
    serializer = ExtracurricularActivitySerializer(activities, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teacher_extracurricular_roles(request):
    roles = ExtracurricularRole.objects.filter(teacher=request.user)
    serializer = ExtracurricularRoleSerializer(roles, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsStaffAdmin])
def save_extracurricular_activity(request):
    data = request.data
    activity_id = data.get('id')
    if activity_id:
        activity = ExtracurricularActivity.objects.get(id=activity_id)
        serializer = ExtracurricularActivitySerializer(activity, data=data, partial=True)
    else:
        serializer = ExtracurricularActivitySerializer(data=data)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsStaffAdmin])
def assign_extracurricular_role(request):
    data = request.data
    serializer = ExtracurricularRoleSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

# --- Central Management Endpoints ---

@api_view(['GET'])
@permission_classes([IsStaffAdmin])
def get_staff_management_detail(request, user_id):
    """
    Fetch ALL data relevant for managing a staff member.
    """
    try:
        user = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get or create profile
    profile, _ = StaffProfile.objects.get_or_create(user=user)
    
    # Academic assignments
    allocations = SubjectAllocation.objects.filter(teacher=user)
    timetable = TimetableEntry.objects.filter(teacher=user)
    
    # Extracurricular
    ec_roles = ExtracurricularRole.objects.filter(teacher=user)
    
    # Documents
    documents = StaffDocument.objects.filter(staff=user)
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'profile_picture': user.profile_picture.url if user.profile_picture else None
        },
        'profile': StaffProfileSerializer(profile).data,
        'assignments': {
            'subjects': SubjectAllocationSerializer(allocations, many=True).data,
            'timetable': TimetableEntrySerializer(timetable, many=True).data,
            'extracurricular': ExtracurricularRoleSerializer(ec_roles, many=True).data
        },
        'documents': StaffDocumentSerializer(documents, many=True).data
    })

@api_view(['POST'])
@permission_classes([IsStaffAdmin])
def toggle_staff_status(request):
    """Activate or Deactivate a staff account"""
    user_id = request.data.get('user_id')
    is_active = request.data.get('is_active')
    
    try:
        user = CustomUser.objects.get(pk=user_id)
        user.is_active = is_active
        user.save()
        return Response({'success': True, 'is_active': user.is_active})
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsStaffAdmin])
def upload_staff_document(request):
    """Upload a certificate or contract"""
    serializer = StaffDocumentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
