from accounting.models import StudentFee
from django.db.models import Sum
import sys

def run():
    sys.stdout.reconfigure(encoding='utf-8')
    print("DASHBOARD_DEBUG_START")
    
    qs = StudentFee.objects.filter(session='2025/2026', term='1st Term')
    count = qs.count()
    print(f"COUNT: {count}")
    
    agg = qs.aggregate(
        total_payable=Sum('total_amount_payable'),
        total_paid=Sum('amount_paid')
    )
    
    payable = agg['total_payable'] or 0
    paid = agg['total_paid'] or 0
    
    print(f"PAYABLE: {payable}")
    print(f"PAID: {paid}")
    print(f"DIFF: {payable - paid}")
    
    if (payable - paid) < 0:
        print("NEGATIVE_BALANCE_FOUND")
        for sf in qs:
            if sf.amount_paid > sf.total_amount_payable:
                print(f"OVERPAID: {sf.student.admission_number} (Payable={sf.total_amount_payable}, Paid={sf.amount_paid})")

    print("DASHBOARD_DEBUG_END")
run()
