from rest_framework import serializers
from .models import Item, Category, Supplier, Supply, Release

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = Item
        fields = '__all__'

class SupplySerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    purchased_by_name = serializers.CharField(source='purchased_by.username', read_only=True)

    class Meta:
        model = Supply
        fields = '__all__'

class ReleaseSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    student_name = serializers.CharField(source='student.admission_number', read_only=True)
    authorized_by_name = serializers.CharField(source='authorized_by.username', read_only=True)
    recipient_user_name = serializers.CharField(source='recipient_user.username', read_only=True)

    class Meta:
        model = Release
        fields = '__all__'
