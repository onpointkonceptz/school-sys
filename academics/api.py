from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Sum
from django.template.loader import render_to_string
from django.http import HttpResponse
from .models import (
    Subject, SubjectAllocation, GradeRecord, StudentReport, 
    GradingScale, LessonPlan, TimetableEntry, StudentAttendance
)
from .serializers import (
    SubjectSerializer, SubjectAllocationSerializer, GradeRecordSerializer, 
    GradingScaleSerializer, LessonPlanSerializer, TimetableEntrySerializer,
    StudentAttendanceSerializer
)
from students.models import Student
from core.models import CustomUser
from xhtml2pdf import pisa
from datetime import datetime
import io

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
    
    # Use provided teacher_id if present, else fallback to request.user or first teacher
    teacher_id = data.get('teacher_id')
    if teacher_id:
        try:
            teacher = CustomUser.objects.get(pk=teacher_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=404)
    else:
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
    
    if not created:
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
                'grade': item.get('grade', ''), # Manual Override
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
    
    # --- POSITION CALCULATION ---
    # 1. Get all students in this class
    class_students = Student.objects.filter(class_grade=student.class_grade).values_list('id', flat=True)
    
    # 2. Get aggregate totals for ALL students in this class for this term/session
    rankings = GradeRecord.objects.filter(
        student_id__in=class_students, 
        term=term, 
        session=session
    ).values('student').annotate(
        grand_total=Sum('total_score')
    ).order_by('-grand_total')
    
    # 3. Find the position
    position = "-"
    class_total = class_students.count()
    for idx, rank in enumerate(rankings):
        if rank['student'] == student.id:
            position = idx + 1
            break
            
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
            'subjects_offered': count,
            'position': position,
            'class_total': class_total
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

@api_view(['GET'])
@permission_classes([AllowAny])
def export_report_pdf(request):
    """
    Generate and stream Report Card PDF
    Query Params: student_id, term, session
    """
    student_id = request.query_params.get('student_id')
    term = request.query_params.get('term', '1st Term')
    session = request.query_params.get('session', '2025/2026')
    
    if not student_id:
        return Response({'error': 'Student ID required'}, status=400)

    # Reuse the logic from get_student_report (effectively)
    # But since we want the response from get_student_report to be consistent,
    # we can call the function directly or just re-implement the fetch.
    # For a clean implementation, I'll just reuse the gathering part.
    
    try:
        student = Student.objects.get(pk=student_id)
    except Student.DoesNotExist:
        return HttpResponse("Student not found", status=404)

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
    
    # Ranking
    class_students = Student.objects.filter(class_grade=student.class_grade).values_list('id', flat=True)
    rankings = GradeRecord.objects.filter(student_id__in=class_students, term=term, session=session).values('student').annotate(grand_total=Sum('total_score')).order_by('-grand_total')
    position = " - "
    class_total = class_students.count()
    for idx, rank in enumerate(rankings):
        if rank['student'] == student.id:
            position = idx + 1
            break

    # Comments
    report = StudentReport.objects.filter(student=student, term=term, session=session).first()
    comments = {
        'class_teacher_comment': report.class_teacher_comment if report else '',
        'principal_comment': report.principal_comment if report else '',
    }

    context = {
        'student': {'name': f"{student.first_name} {student.last_name}", 'admission_number': student.admission_number, 'class_grade': student.class_grade},
        'results': results,
        'summary': {'total_score': total_score, 'average': average},
        'position': position,
        'class_total': class_total,
        'comments': comments,
        'term': term,
        'session': session,
        'current_year': datetime.now().year
    }

    # Render HTML
    html = render_to_string('academics/report_card.html', context)
    
    # Create PDF
    result = io.BytesIO()
    pdf = pisa.pisaDocument(io.BytesIO(html.encode("UTF-8")), result)
    
    if not pdf.err:
        filename = f"Report_{student.admission_number}_{term.replace(' ', '_')}.pdf"
        response = HttpResponse(result.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    return HttpResponse("Error generating PDF", status=500)

# --- Lesson Plan Endpoints ---

@api_view(['GET'])
@permission_classes([AllowAny])
def get_lesson_plans(request):
    """List lesson plans for the logged-in teacher or all for admins"""
    class_grade = request.query_params.get('class_grade')
    subject_id = request.query_params.get('subject_id')
    
    plans = LessonPlan.objects.all().order_by('-date')
    
    if request.user.is_authenticated and request.user.role == 'TEACHER':
        plans = plans.filter(teacher=request.user)
    
    if class_grade:
        plans = plans.filter(class_grade=class_grade)
    if subject_id:
        plans = plans.filter(subject_id=subject_id)
        
    serializer = LessonPlanSerializer(plans, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def save_lesson_plan(request):
    """Create or Update a Lesson Plan"""
    data = request.data
    plan_id = data.get('id')
    
    if not request.user.is_authenticated:
        # Fallback to teacher1 if testing
        user_id = CustomUser.objects.filter(role='TEACHER').first().id
    else:
        user_id = request.user.id

    if plan_id:
        plan = LessonPlan.objects.get(id=plan_id)
        serializer = LessonPlanSerializer(plan, data=data, partial=True)
    else:
        # Auto-assign teacher
        data['teacher'] = user_id
        serializer = LessonPlanSerializer(data=data)
        
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_lesson_plan(request, pk):
    """Delete a lesson plan"""
    try:
        plan = LessonPlan.objects.get(pk=pk)
        plan.delete()
        return Response({'success': True})
    except LessonPlan.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_lesson_plan_history(request, pk):
    """Get version history for a lesson plan"""
    try:
        plan = LessonPlan.objects.get(pk=pk)
        history = plan.history.all()
        history_data = []
        for h in history:
            history_data.append({
                'id': h.id,
                'history_date': h.history_date,
                'history_type': h.history_type,
                'title': h.title,
                'objectives': h.objectives,
                'updated_by': h.history_user.username if h.history_user else 'System'
            })
        return Response(history_data)
    except LessonPlan.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

# --- Timetable Endpoints ---

@api_view(['GET'])
@permission_classes([AllowAny])
def get_timetable(request):
    """Get timetable for a class"""
    class_grade = request.query_params.get('class_grade')
    if not class_grade:
        return Response({'error': 'Class grade required'}, status=status.HTTP_400_BAD_REQUEST)
        
    entries = TimetableEntry.objects.filter(class_grade=class_grade).order_by('day_of_week', 'start_time')
    serializer = TimetableEntrySerializer(entries, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def save_timetable_entry(request):
    """Create/Update timetable entry"""
    data = request.data
    entry_id = data.get('id')
    
    if entry_id:
        entry = TimetableEntry.objects.get(id=entry_id)
        serializer = TimetableEntrySerializer(entry, data=data, partial=True)
    else:
        serializer = TimetableEntrySerializer(data=data)
        
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_timetable_entry(request, pk):
    try:
        entry = TimetableEntry.objects.get(pk=pk)
        entry.delete()
        return Response({'success': True})
    except TimetableEntry.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


# --- Student Attendance Endpoints ---

@api_view(['GET'])
@permission_classes([AllowAny])
def get_student_attendance(request):
    """
    Get attendance for a class on a specific date
    """
    class_grade = request.query_params.get('class_grade')
    date_str = request.query_params.get('date')
    
    if not class_grade or not date_str:
        return Response({'error': 'Class grade and date required'}, status=400)
        
    try:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        
    # Get students in class
    label_to_code = {label: code for code, label in Student.ClassGrade.choices}
    if class_grade in label_to_code:
        class_grade = label_to_code[class_grade]
        
    students = Student.objects.filter(class_grade=class_grade).exclude(
        student_status__in=[Student.StudentStatus.GRADUATED, Student.StudentStatus.WITHDRAWN, Student.StudentStatus.TRANSFERRED]
    )
    
    attendance_records = StudentAttendance.objects.filter(student__in=students, date=date)
    attendance_map = {a.student_id: a for a in attendance_records}
    
    data = []
    for s in students:
        record = attendance_map.get(s.id)
        if record:
            data.append(StudentAttendanceSerializer(record).data)
        else:
            data.append({
                'student': s.id,
                'student_name': f"{s.first_name} {s.last_name}",
                'date': date_str,
                'status': 'PRESENT',
                'remarks': ''
            })
            
    return Response(data)

@api_view(['POST'])
@permission_classes([AllowAny])
def mark_student_attendance(request):
    """
    Bulk save student attendance
    """
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role not in [CustomUser.Role.TEACHER, CustomUser.Role.SUPER_ADMIN]:
        return Response({'success': False, 'error': 'Unauthorized'}, status=403)
        
    data = request.data
    attendance_list = data.get('attendance', [])
    date_str = data.get('date')
    
    if not date_str:
        return Response({'error': 'Date required'}, status=400)
        
    saved_count = 0
    for item in attendance_list:
        student_id = item.get('student')
        status_val = item.get('status', 'PRESENT')
        remarks = item.get('remarks', '')
        
        record, created = StudentAttendance.objects.update_or_create(
            student_id=student_id,
            date=date_str,
            defaults={
                'status': status_val,
                'remarks': remarks,
                'recorded_by': request.user if request.user.is_authenticated else None
            }
        )
        saved_count += 1
        
    return Response({'success': True, 'saved': saved_count})
