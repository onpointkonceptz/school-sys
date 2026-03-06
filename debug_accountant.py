from rest_framework.test import APIRequestFactory, force_authenticate
from core.api import dashboard_api
from core.models import CustomUser

def run():
    factory = APIRequestFactory()
    request = factory.get('/api/dashboard/')
    
    # Find an accountant
    accountant = CustomUser.objects.filter(role='ACCOUNT_OFFICER').first()
    if not accountant:
        print("No ACCOUNT_OFFICER found. creating one...")
        accountant = CustomUser.objects.create_user('debug_accountant', 'acc@debug.com', 'password123', role='ACCOUNT_OFFICER')
    
    print(f"Testing as {accountant.username} ({accountant.role})")
    force_authenticate(request, user=accountant)
    
    try:
        response = dashboard_api(request)
        print(f"Status: {response.status_code}")
        print("Response Data:", response.data)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    run()
