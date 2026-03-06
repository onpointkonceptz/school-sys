import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

def run():
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(accounting_studentfee)")
        columns = [row[1] for row in cursor.fetchall()]
        print("Columns in accounting_studentfee:")
        print(columns)

        # Also check if 'fee_structure__amount' was what I was using before
        # The error might be because I reverted to an old version? NO.
        
        # Let's also check if I can query it directly
        try:
            from accounting.models import StudentFee
            print("\nTrying to access 'total_amount_payable'...")
            first = StudentFee.objects.first()
            if first:
                print(f"First record: {first.total_amount_payable}")
            else:
                print("No records found.")
        except Exception as e:
            print(f"Access failed: {e}")

if __name__ == '__main__':
    run()
