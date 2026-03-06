import os
import sys
import django

# Add project root to path
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

try:
    import inventory
    print(f"Imported inventory: {inventory}")
    import inventory.urls
    print(f"Imported inventory.urls: {inventory.urls}")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"Error: {e}")
