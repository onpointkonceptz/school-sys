from accounting.models import FeeStructure, StudentFee
from students.models import Student

def run():
    print("Debug Fee Matching...")
    
    # 1. Get the problematic student fee record
    try:
        sf = StudentFee.objects.get(student__admission_number='KAD/25/006')
    except StudentFee.DoesNotExist:
        print("StudentFee for KAD/25/006 not found!")
        return

    student = sf.student
    print(f"Student: {student.admission_number}")
    print(f"  Class: '{student.class_grade}'")
    print(f"  Status: '{student.student_status}'")
    print(f"  Type: '{student.student_type}'")
    
    print(f"Fee Search Criteria:")
    print(f"  Term: '{sf.term}'")
    print(f"  Session: '{sf.session}'")
    
    # 2. Try to find matching fees step-by-step
    
    # Step A: Filter by Class only
    fees_class = FeeStructure.objects.filter(class_grade=student.class_grade)
    print(f"Found {fees_class.count()} fees for class '{student.class_grade}'")
    for f in fees_class:
        print(f"  - {f.name}: Status='{f.student_status}', Type='{f.student_type}', Term='{f.term}', Session='{f.session}'")
        
    # Step B: Filter by Term/Session
    fees_term = fees_class.filter(term=sf.term, session=sf.session)
    print(f"Found {fees_term.count()} fees for class + term/session")

    # Step C: Filter by Status (allow None)
    status_list = [student.student_status, None, '']
    fees_status = fees_term.filter(student_status__in=status_list)
    print(f"Found {fees_status.count()} fees matching status in {status_list}")
    
    # Step D: Filter by Type (allow None)
    type_list = [student.student_type, None, '']
    fees_final = fees_status.filter(student_type__in=type_list)
    print(f"Found {fees_final.count()} fees matching type in {type_list}")
    
    if fees_final.count() == 0:
        print("MATCH FAILED!")
    else:
        print(f"MATCH SUCCESS! Total Amount: {sum(f.amount for f in fees_final)}")

run()
