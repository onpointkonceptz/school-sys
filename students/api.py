from rest_framework.decorators import api_view, permission_classes, parser_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import Student, StudentAcademicHistory
from .serializers import StudentSerializer
import uuid
from django.db import transaction
from django.db.models import Q

from django.views.decorators.csrf import csrf_exempt

from accounting.models import StudentFee

@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    from academics.models import SubjectAllocation
    stats = []
    
    # Iterate over all defined class choices
    for code, label in Student.ClassGrade.choices:
        students = Student.objects.filter(class_grade=code)
        total = students.count()
        boarding = students.filter(student_type=Student.StudentType.BOARDING).count()
        day = students.filter(student_type=Student.StudentType.DAY).count()
        
        # Fee Stats
        # Get all fees for students in this class
        fees = StudentFee.objects.filter(student__in=students)
        fully_paid = fees.filter(is_fully_paid=True).count()
        
        # Outstanding is simple count of those not fully paid? 
        # Or should be based on if they have any fee record at all?
        # Let's count students who have outstanding balance > 0
        with_debt = 0
        for f in fees:
             if f.outstanding_balance > 0:
                 with_debt += 1
                 
        stats.append({
            'code': code,
            'label': label,
            'total_students': total,
            'boarding': boarding,
            'day': day,
            'fully_paid': fully_paid,
            'with_outstanding': with_debt
        })
    
    return Response(stats)


@api_view(['GET', 'POST'])
@csrf_exempt
@permission_classes([AllowAny])
def student_list_create(request):
    if request.method == 'GET':
        class_filter = request.query_params.get('class_grade')
        search_term = request.query_params.get('search')
        
        students = Student.objects.all().order_by('-created_at')
        
        if class_filter:
            students = students.filter(class_grade=class_filter)
            
        if search_term:
            from django.db.models import Q
            students = students.filter(
                Q(first_name__icontains=search_term) | 
                Q(last_name__icontains=search_term) | 
                Q(admission_number__icontains=search_term) |
                Q(parent_phone__icontains=search_term)
            )
            
        data = []
        for s in students:
            # Get latest fee record (current term)
            # In real app, filter by current session/term
            fee = StudentFee.objects.filter(student=s).last()
            
            data.append({
                'id': s.id,
                'admission_number': s.admission_number,
                'first_name': s.first_name,
                'last_name': s.last_name,
                'class_grade': s.get_class_grade_display(),
                'class_grade_code': s.class_grade,
                'student_type': s.get_student_type_display(),
                'student_status': s.get_student_status_display(),
                'parent_name': s.parent_name,
                'parent_phone': s.parent_phone,
                'is_boarding': s.student_type == Student.StudentType.BOARDING,
                'full_name': f"{s.first_name} {s.last_name}",
                # Fee Details
                'total_fees': fee.total_amount_payable if fee else 0,
                'amount_paid': fee.amount_paid if fee else 0,
                'balance': fee.outstanding_balance if fee else 0,
                'payment_status': 'PAID' if (fee and fee.is_fully_paid) else ('PARTIAL' if (fee and fee.amount_paid > 0) else 'UNPAID')
            })
        return Response(data)
    
    elif request.method == 'POST':
        # Use Serializer for validation and creation
        # We need to handle admission number generation if not provided
        data = request.data.copy()
        # Admission number is generated inside StudentSerializer.create()
        # if not explicitly provided — no need to handle it here.
        serializer = StudentSerializer(data=data)
        if serializer.is_valid():
            student = serializer.save()
            return Response({'success': True, 'id': student.id, 'admission_number': student.admission_number})
        return Response({'success': False, 'error': serializer.errors}, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@csrf_exempt
@permission_classes([AllowAny])
def student_detail(request, pk):
    try:
        student = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response(status=404)

    if request.method == 'GET':
        # Return full details including fee summary
        fee = StudentFee.objects.filter(student=student).last()
        data = {
            'id': student.id,
            'admission_number': student.admission_number,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'class_grade': student.class_grade,
            'student_type': student.student_type,
            'student_status': student.student_status,
            'parent_name': student.parent_name,
            'parent_phone': student.parent_phone,
            'parent_email': student.parent_email,
            'current_term': student.current_term,
            'current_session': student.current_session,
            # Fee Snapshot
            'total_fees': fee.total_amount_payable if fee else 0,
            'amount_paid': fee.amount_paid if fee else 0,
            'balance': fee.outstanding_balance if fee else 0
        }
        return Response(data)

    elif request.method == 'PUT':
        serializer = StudentSerializer(student, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True})
        return Response({'success': False, 'error': serializer.errors}, status=400)

    elif request.method == 'DELETE':
        student.delete()
        return Response(status=204)

@api_view(['POST'])
@permission_classes([AllowAny])
def promote_student(request, pk):
    try:
        student = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({'success': False, 'error': 'Student not found'}, status=404)

    data = request.data
    new_class = data.get('new_class')
    new_session = data.get('new_session')
    
    if not new_class or not new_session:
        return Response({'success': False, 'error': 'New class and session are required'}, status=400)

    try:
        with transaction.atomic():
            # 1. Archive current state to history
            StudentAcademicHistory.objects.create(
                student=student,
                academic_session=student.current_session,
                class_grade=student.class_grade,
                student_status=student.student_status,
                comments=f"Promoted to {new_class}"
            )

            # 2. Update Student Record
            student.class_grade = new_class
            student.current_session = new_session
            # Update other fields if provided (e.g. status)
            if data.get('student_status'):
                student.student_status = data.get('student_status')
            
            student.save()

            return Response({'success': True, 'message': 'Student promoted successfully'})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)


@api_view(['GET'])
@csrf_exempt
@authentication_classes([])
@permission_classes([AllowAny])
def preview_promotion(request):
    """
    Preview students eligible for promotion from a class.
    GET /students/preview-promotion/?from_class=JSS_1&session=2025/2026&qualify_by=pass
    Returns list of students with their pass/fail status per the current session's grades.
    """
    from academics.models import GradeRecord

    from_class = request.query_params.get('from_class')
    session = request.query_params.get('session', '2025/2026')
    qualify_by = request.query_params.get('qualify_by', 'all')  # 'all' or 'pass'

    if not from_class:
        return Response({'error': 'from_class is required'}, status=400)

    # Fetch all current students in this class.
    # Exclude only terminal statuses — newly registered students have status NEW,
    # not ACTIVE, so filtering by ACTIVE would miss them entirely.
    TERMINAL = [
        Student.StudentStatus.GRADUATED,
        Student.StudentStatus.WITHDRAWN,
        Student.StudentStatus.TRANSFERRED,
    ]
    students = Student.objects.filter(class_grade=from_class).exclude(student_status__in=TERMINAL)

    result = []
    for s in students:
        # Determine pass/fail based on grades in current session
        grades = GradeRecord.objects.filter(
            student=s,
            session=session
        )
        if not grades.exists():
            # No grades recorded — treat as ungraded (can still be promoted)
            qualifies = True
            status_label = 'UNGRADED'
        else:
            # Fails if ALL grade records are F
            failing = grades.filter(grade='F').count()
            passing = grades.exclude(grade='F').count()
            qualifies = passing > 0
            status_label = 'PASS' if qualifies else 'FAIL'

        result.append({
            'id': s.id,
            'full_name': f"{s.first_name} {s.last_name}",
            'admission_number': s.admission_number,
            'class_grade': s.class_grade,
            'student_type': s.student_type,
            'qualifies': qualifies,
            'grade_status': status_label,
            'total_grades': grades.count(),
        })

    # If qualify_by=pass, mark non-qualifiers for frontend (don't auto-exclude, let user decide)
    return Response({
        'from_class': from_class,
        'session': session,
        'total': len(result),
        'students': result
    })


@api_view(['POST'])
@csrf_exempt
@authentication_classes([])
@permission_classes([AllowAny])
def bulk_promote_class(request):
    """
    Bulk promote students from one class to another.
    POST body: {
        from_class: "JSS_1",
        to_class: "JSS_2",
        new_session: "2026/2027",
        student_ids: [1, 2, 3],   // IDs to promote (checked by user in preview)
        comments: ""               // optional
    }
    """
    data = request.data
    from_class = data.get('from_class')
    to_class = data.get('to_class')
    new_session = data.get('new_session')
    student_ids = data.get('student_ids', [])
    comments = data.get('comments', '')

    if not from_class or not to_class or not new_session:
        return Response({'error': 'from_class, to_class, and new_session are required'}, status=400)

    if from_class == to_class:
        return Response({'error': 'from_class and to_class must be different'}, status=400)

    if not student_ids:
        return Response({'error': 'No students selected for promotion'}, status=400)

    promoted = 0
    skipped = 0
    errors = []

    with transaction.atomic():
        # Fetch only the explicitly selected students (IDs come from the user-reviewed preview)
        students = Student.objects.filter(pk__in=student_ids)

        for student in students:
            try:
                # 1. Archive to history
                StudentAcademicHistory.objects.create(
                    student=student,
                    academic_session=student.current_session,
                    class_grade=student.class_grade,
                    student_status=student.student_status,
                    comments=comments or f"Bulk promoted from {from_class} to {to_class} for session {new_session}"
                )

                # 2. Move student
                student.class_grade = to_class
                student.current_session = new_session
                student.student_status = Student.StudentStatus.ACTIVE
                student.save()

                promoted += 1
            except Exception as e:
                errors.append({'student_id': student.id, 'error': str(e)})
                skipped += 1

    return Response({
        'success': True,
        'promoted': promoted,
        'skipped': skipped,
        'errors': errors,
        'message': f"Successfully promoted {promoted} student(s) to {to_class} for session {new_session}."
    })
