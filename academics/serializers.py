from rest_framework import serializers
from .models import Subject, SubjectAllocation, GradeRecord, StudentReport, GradingScale

class GradingScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradingScale
        fields = '__all__'
from students.serializers import StudentSerializer

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class SubjectAllocationSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.first_name', read_only=True)
    
    class Meta:
        model = SubjectAllocation
        fields = ['id', 'subject', 'subject_name', 'teacher', 'teacher_name', 'class_grade', 'session']

class GradeRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    student_last_name = serializers.CharField(source='student.last_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    
    class Meta:
        model = GradeRecord
        fields = [
            'id', 'student', 'student_name', 'student_last_name', 'admission_number',
            'test_score', 'assignment_score', 'midterm_score', 'exam_score',
            'total_score', 'grade', 'remark', 'term', 'session'
        ]
        extra_kwargs = {
            'remark': {'read_only': False, 'required': False} # Explicitly writable
        }

class StudentReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentReport
        fields = '__all__'
