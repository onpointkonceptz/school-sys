from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Subject, SubjectAllocation, GradeRecord, StudentReport, GradingScale
from .serializers import SubjectSerializer, SubjectAllocationSerializer, GradeRecordSerializer, StudentReportSerializer, GradingScaleSerializer
from students.models import Student
from core.models import CustomUser
from rest_framework import status

@api_view(['GET'])
@permission_classes([AllowAny])
def get_subjects(request):
    """
    Returns all subjects
    """
    subjects = Subject.objects.all()
    serializer = SubjectSerializer(subjects, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def assign_subject(request):
    """
    Assign a subject to the current teacher for a specific class
    """
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role not in [CustomUser.Role.TEACHER, CustomUser.Role.SUPER_ADMIN]:
        return Response({'success': False, 'error': 'Only Teachers or Admins can modify allocations.'}, status=403)
    data = request.data
    subject_id = data.get('subject_id')
    class_grade = data.get('class_grade')
    session = data.get('session', '2025/2026')
    
    if not subject_id or not class_grade:
        return Response({'error': 'Subject and Class Grade required'}, status=400)
    
    # Use request user as teacher, fallback if not auth (for dev)
    teacher = request.user if request.user.is_authenticated else CustomUser.objects.filter(role=CustomUser.Role.TEACHER).first()
    
    try:
        subject = Subject.objects.get(pk=subject_id)
    except Subject.DoesNotExist:
        return Response({'error': 'Subject not found'}, status=404)
        
    allocation, created = SubjectAllocation.objects.get_or_create(
        subject=subject,
        class_grade=class_grade,
        session=session,
        defaults={'teacher': teacher}
    )
    
    if not created and allocation.teacher != teacher:
         # Optional: Allow takeover? Or just update? For now, update.
         allocation.teacher = teacher
         allocation.save()
    
    return Response(SubjectAllocationSerializer(allocation).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def unassign_subject(request):
    """
    Remove an allocation (Unassign subject from class)
    """
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role not in [CustomUser.Role.TEACHER, CustomUser.Role.SUPER_ADMIN]:
        return Response({'success': False, 'error': 'Only Teachers or Admins can unassign subjects.'}, status=403)
    allocation_id = request.data.get('allocation_id')
    try:
        allocation = SubjectAllocation.objects.get(pk=allocation_id)
        allocation.delete()
        return Response({'success': True})
    except SubjectAllocation.DoesNotExist:
        return Response({'error': 'Allocation not found'}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny])
def save_subject(request):
    """
    Create or Update a Subject
    """
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role not in [CustomUser.Role.TEACHER, CustomUser.Role.SUPER_ADMIN]:
        return Response({'error': 'Only Teachers or Admins can modify subjects.'}, status=403)
    data = request.data
    subject_id = data.get('id')
    name = data.get('name')
    code = data.get('code', '').upper()
    
    if not name:
        return Response({'error': 'Name is required'}, status=400)

    if subject_id:
        try:
            subject = Subject.objects.get(pk=subject_id)
            subject.name = name
            subject.code = code
            subject.save()
        except Subject.DoesNotExist:
            return Response({'error': 'Subject not found'}, status=404)
    else:
        subject = Subject.objects.create(name=name, code=code)
        
    return Response(SubjectSerializer(subject).data)

@api_view(['POST'])
@permission_classes([AllowAny])
def delete_subject(request):
    """
    Delete a Subject
    """
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role not in [CustomUser.Role.TEACHER, CustomUser.Role.SUPER_ADMIN]:
        return Response({'error': 'Only Teachers or Admins can delete subjects.'}, status=403)
    subject_id = request.data.get('id')
    try:
        subject = Subject.objects.get(pk=subject_id)
        subject.delete()
        return Response({'success': True})
    except Subject.DoesNotExist:
        return Response({'error': 'Subject not found'}, status=404)

@api_view(['GET'])
@permission_classes([AllowAny]) # In prod, use IsAuthenticated
def get_teacher_classes(request):
    """
    Returns subjects allocated to the logged-in teacher (or all if admin)
    """
    user = request.user
    
    if not user.is_authenticated:
        # Fallback for dev/demo if auth is tricky
        allocations = SubjectAllocation.objects.all()
        return Response(SubjectAllocationSerializer(allocations, many=True).data)
        
    if user.role in [CustomUser.Role.TEACHER]:
        allocations = SubjectAllocation.objects.filter(teacher=user)
    else:
        # Admin / Principal see all
        allocations = SubjectAllocation.objects.all()
        
    return Response(SubjectAllocationSerializer(allocations, many=True).data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_grading_scales(request):
    """
    Returns all grading scales ordered by min_score desc
    """
    scales = GradingScale.objects.all().order_by('-min_score')
    serializer = GradingScaleSerializer(scales, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def save_grading_scale(request):
    """
    Create or Update a Grading Scale
    """
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role not in [CustomUser.Role.TEACHER, CustomUser.Role.SUPER_ADMIN]:
        return Response({'error': 'Only Teachers or Admins can modify grading configuration.'}, status=403)
    data = request.data
    scale_id = data.get('id')
    
    defaults = {
        'min_score': data.get('min_score'),
        'max_score': data.get('max_score'),
        'grade': data.get('grade'),
        'remark': data.get('remark')
    }
    
    if scale_id:
        GradingScale.objects.filter(pk=scale_id).update(**defaults)
        scale = GradingScale.objects.get(pk=scale_id)
    else:
        scale = GradingScale.objects.create(**defaults)
        
    return Response(GradingScaleSerializer(scale).data)

@api_view(['POST'])
@permission_classes([AllowAny])
def delete_grading_scale(request):
    """
    Delete a Grading Scale
    """
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role not in [CustomUser.Role.TEACHER, CustomUser.Role.SUPER_ADMIN]:
        return Response({'error': 'Only Teachers or Admins can delete grading configuration.'}, status=403)
    scale_id = request.data.get('id')
    try:
        GradingScale.objects.get(pk=scale_id).delete()
        return Response({'success': True})
    except GradingScale.DoesNotExist:
        return Response({'error': 'Scale not found'}, status=404)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_class_gradebook(request):
    """
    Get students and their grades for a specific allocation (Subject + Class)
    Query Params: allocation_id
    """
    allocation_id = request.query_params.get('allocation_id')
    if not allocation_id:
        return Response({'error': 'Allocation ID required'}, status=400)
        
    try:
        allocation = SubjectAllocation.objects.get(pk=allocation_id)
    except SubjectAllocation.DoesNotExist:
        return Response({'error': 'Allocation not found'}, status=404)
        
    # 1. Get all active students in this class
    # Resolve label→code in case the allocation stored a human-readable label (e.g. "Nursery 2")
    # instead of the DB code (e.g. "NRS2")
    class_grade_value = allocation.class_grade
    label_to_code = {label: code for code, label in Student.ClassGrade.choices}
    if class_grade_value in label_to_code:
        class_grade_value = label_to_code[class_grade_value]
    # Fetch ALL students in this class, excluding only terminal statuses.
    # Manually registered students have status='NEW' (not 'ACTIVE'), so filtering
    # by ACTIVE would exclude them from grading entirely.
    TERMINAL = [
        Student.StudentStatus.GRADUATED,
        Student.StudentStatus.WITHDRAWN,
        Student.StudentStatus.TRANSFERRED,
    ]
    students = Student.objects.filter(class_grade=class_grade_value).exclude(student_status__in=TERMINAL)
    
    # 2. Get existing grades
    grade_map = {
        g.student_id: g 
        for g in GradeRecord.objects.filter(allocation=allocation, session=allocation.session)
    }
    
    # 3. Build Response Data (Combine Student + Grade)
    data = []
    for student in students:
        grade_record = grade_map.get(student.id)
        if grade_record:
            data.append(GradeRecordSerializer(grade_record).data)
        else:
            # Empty template for student with no grade yet
            data.append({
                'student': student.id,
                'student_name': student.first_name,
                'student_last_name': student.last_name,
                'admission_number': student.admission_number,
                'test_score': 0,
                'assignment_score': 0,
                'midterm_score': 0,
                'exam_score': 0,
                'total_score': 0,
                'grade': '-',
                'remark': '-'
            })
            
    return Response({
        'allocation': SubjectAllocationSerializer(allocation).data,
        'students': data
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def save_grades(request):
    """
    Bulk save grades
    dats: { allocation_id: 1, grades: [ {student_id, test, exam...} ] }
    """
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role not in [CustomUser.Role.TEACHER, CustomUser.Role.SUPER_ADMIN]:
        return Response({'success': False, 'error': 'Only Teachers or Admins can save grades.'}, status=403)
        
    data = request.data
    allocation_id = data.get('allocation_id')
    grades = data.get('grades', [])
    
    try:
        allocation = SubjectAllocation.objects.get(pk=allocation_id)
    except SubjectAllocation.DoesNotExist:
        return Response({'error': 'Allocation not found'}, status=404)

    # Permission check (Teacher can only edit own)
    if request.user.is_authenticated and request.user.role == CustomUser.Role.TEACHER:
        if allocation.teacher != request.user:
            return Response({'error': 'Unauthorized'}, status=403)

    saved_count = 0
    for item in grades:
        student_id = item.get('student')
        
        # Create or Update
        record, created = GradeRecord.objects.update_or_create(
            student_id=student_id,
            allocation=allocation,
            session=allocation.session,
            defaults={
                'test_score': item.get('test_score', 0),
                'assignment_score': item.get('assignment_score', 0),
                'midterm_score': item.get('midterm_score', 0),
                'exam_score': item.get('exam_score', 0),
                'recorded_by': request.user if request.user.is_authenticated else None,
                'term': item.get('term', '1st Term'), # Ensure term matches
                'remark': item.get('remark', '') # Manual Override
            }
        )
        saved_count += 1
        
    return Response({'success': True, 'saved': saved_count})

@api_view(['GET'])
@permission_classes([AllowAny])
def get_student_report(request):
    """
    Get Report Card for a Student
    """
    student_id = request.query_params.get('student_id')
    term = request.query_params.get('term', '1st Term')
    session = request.query_params.get('session', '2025/2026')
    
    if not student_id:
        return Response({'error': 'Student ID required'}, status=400)
        
    try:
        student = Student.objects.get(pk=student_id)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
        
    grades = GradeRecord.objects.filter(student=student, term=term, session=session).select_related('allocation__subject')
    
    results = []
    total_score = 0
    count = 0
    
    for g in grades:
        results.append({
            'subject': g.allocation.subject.name,
            'test': g.test_score,
            'assignment': g.assignment_score,
            'midterm': g.midterm_score,
            'exam': g.exam_score,
            'total': g.total_score,
            'grade': g.grade,
            'remark': g.remark
        })
        total_score += float(g.total_score)
        count += 1
        
    average = round(total_score / count, 2) if count > 0 else 0
    
    return Response({
        'student': {
            'name': f"{student.first_name} {student.last_name}",
            'admission_number': student.admission_number,
            'class_grade': student.class_grade
        },
        'results': results,
        'summary': {
            'total_score': total_score,
            'average': average,
            'subjects_offered': count
        },
        # Add existing report data if any
        'comments': {
            'class_teacher_comment': report_list[0].class_teacher_comment,
            'principal_comment': report_list[0].principal_comment,
            'affective_domain': report_list[0].affective_domain,
            'psychomotor_domain': report_list[0].psychomotor_domain
        } if (report_list := list(StudentReport.objects.filter(student=student, term=term, session=session))) else {}
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def save_student_report(request):
    """
    Save comments and traits
    """
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role not in [CustomUser.Role.TEACHER, CustomUser.Role.SUPER_ADMIN]:
        return Response({'success': False, 'error': 'Only Teachers or Admins can modify report comments.'}, status=403)
        
    data = request.data
    student_id = data.get('student_id')
    term = data.get('term', '1st Term')
    session = data.get('session', '2025/2026')
    
    try:
        student = Student.objects.get(pk=student_id)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
        
    report, created = StudentReport.objects.update_or_create(
        student=student,
        term=term,
        session=session,
        defaults={
            'class_teacher_comment': data.get('class_teacher_comment', ''),
            'principal_comment': data.get('principal_comment', ''),
            'affective_domain': data.get('affective_domain', {}),
            'psychomotor_domain': data.get('psychomotor_domain', {})
        }
    )
    
    return Response({'success': True, 'report_id': report.id})
