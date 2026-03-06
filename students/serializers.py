from rest_framework import serializers
from .models import Student
from datetime import date


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'
        # admission_number is generated in create() so it stays writable.
        # date_of_admission is also writable — admin can back-date registrations.
        read_only_fields = ('created_at', 'updated_at')

    def create(self, validated_data):
        # Generate a unique admission number if one wasn't provided.
        if not validated_data.get('admission_number'):
            year = date.today().year
            prefix = f'KAD/{year}/'
            existing = set(
                Student.objects.filter(admission_number__startswith=prefix)
                .values_list('admission_number', flat=True)
            )
            seq = Student.objects.count() + 1
            candidate = f'{prefix}{seq:04d}'
            while candidate in existing:
                seq += 1
                candidate = f'{prefix}{seq:04d}'
            validated_data['admission_number'] = candidate

        return super().create(validated_data)
