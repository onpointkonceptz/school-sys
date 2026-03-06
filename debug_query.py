import os
import django
from django.db.models import Sum

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounting.models import StudentFee

def test_query():
    print("Testing Cashier Query...")
    try:
        outstanding = StudentFee.objects.filter(fully_paid=False).aggregate(
             debt=Sum('fee_structure__amount') - Sum('amount_paid')
        )['debt'] or 0
        print(f"Success! Outstanding Debt: {outstanding}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_query()
