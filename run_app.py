import os
import sys
import django
import threading
import time
import webbrowser
from pathlib import Path

# Set settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Bootstrap Django
django.setup()

from django.core.management import call_command
from config.wsgi import application

def get_data_dir():
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent

def auto_setup():
    from django.conf import settings
    import sys
    print(f"DEBUG PATHS: sys.frozen={getattr(sys, 'frozen', False)}")
    print(f"DEBUG PATHS: sys.executable={sys.executable}")
    print(f"DEBUG PATHS: settings.BASE_DIR={settings.BASE_DIR}")
    print(f"DEBUG PATHS: db_name={settings.DATABASES['default']['NAME']}")
    print(f"DEBUG PATHS: media_root={settings.MEDIA_ROOT}")
    print("Checking database status and running migrations...")
    try:
        # Run migrations automatically
        call_command('migrate', interactive=False)
        print("Database migrations applied successfully.")
        
        # Seed admin and chairman users
        call_command('createadmin')
        print("Default users check/seeding completed.")
    except Exception as e:
        print(f"Error during auto-setup: {e}", file=sys.stderr)

def open_browser():
    # Wait a moment for Waitress to spin up
    time.sleep(1.5)
    url = "http://localhost:8000"
    print(f"Opening browser to {url}...")
    webbrowser.open(url)

if __name__ == '__main__':
    # Initialize database & static setup
    auto_setup()
    
    # Launch browser asynchronously
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Start the production-ready Waitress WSGI server
    from waitress import serve
    print("Starting Kadwel School application server on http://localhost:8000...")
    print("Press Ctrl+C to stop the application.")
    serve(application, host='127.0.0.1', port=8000, threads=6)
