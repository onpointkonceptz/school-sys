import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from inventory.models import Item, Category, Release, Supply
from students.models import Student
from accounting.models import FeeStructure, StudentFee, Transaction
from core.models import CustomUser

def run_tests():
    print("Running Tests...")
    
    # --- Inventory Test ---
    print("\n[Inventory] Testing Stock Depletion...")
    cat = Category.objects.create(name="Utilities")
    item = Item.objects.create(name="NoteBooks", category=cat, unit_price=5.00, stock_remaining=100)
    print(f"Initial Stock: {item.stock_remaining}")
    
    # Release 20 items
    Release.objects.create(item=item, quantity_released=20, recipient_department="Admin")
    
    item.refresh_from_db()
    print(f"Stock after Release (20): {item.stock_remaining}")
    assert item.stock_remaining == 80, f"Expected 80, got {item.stock_remaining}"
    print("PASS: Stock Depletion Logic")

    # --- Accounting Test ---
    print("\n[Accounting] Testing Fee Logic (Day vs Boarding)...")
    
    # Create Students
    day_student = Student.objects.create(first_name="Day", last_name="Student", admission_number="D001", is_boarding=False)
    boarding_student = Student.objects.create(first_name="Board", last_name="Student", admission_number="B001", is_boarding=True)
    
    # Create Fees
    tuition = FeeStructure.objects.create(name="Tuition", amount=5000, term="1st Term", session="2024", is_boarding_only=False)
    boarding_fee = FeeStructure.objects.create(name="Boarding Fee", amount=3000, term="1st Term", session="2024", is_boarding_only=True)
    
    # Check Fees Assigned
    day_fees = StudentFee.objects.filter(student=day_student).values_list('fee_structure__name', flat=True)
    board_fees = StudentFee.objects.filter(student=boarding_student).values_list('fee_structure__name', flat=True)
    
    print(f"Day Student Fees: {list(day_fees)}")
    print(f"Boarding Student Fees: {list(board_fees)}")
    
    assert "Tuition" in day_fees and "Boarding Fee" not in day_fees, "Day Student Fee Error"
    assert "Tuition" in board_fees and "Boarding Fee" in board_fees, "Boarding Student Fee Error"
    print("PASS: Fee Assignment Logic")
    
    # --- Transaction Test ---
    print("\n[Accounting] Testing Payment Logic...")
    # Pay 4000 for Tuition (Total 5000)
    Transaction.objects.create(student=day_student, amount_paid=4000, reference_number="REF001")
    
    day_fee_obj = StudentFee.objects.get(student=day_student, fee_structure=tuition)
    print(f"Tuition Paid: {day_fee_obj.amount_paid}, Fully Paid: {day_fee_obj.fully_paid}")
    
    assert day_fee_obj.amount_paid == 4000, "Payment not recorded correctly"
    assert not day_fee_obj.fully_paid, "Should not be fully paid"
    
    # Pay remaining 1000
    Transaction.objects.create(student=day_student, amount_paid=1000, reference_number="REF002")
    day_fee_obj.refresh_from_db()
    print(f"Tuition Paid: {day_fee_obj.amount_paid}, Fully Paid: {day_fee_obj.fully_paid}")
    
    assert day_fee_obj.amount_paid == 5000, "Total payment incorrect"
    assert day_fee_obj.fully_paid, "Should be fully paid"
    print("PASS: Payment Logic")
    
    print("\nALL TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
