
import os
import shutil
import glob

# Paths
db_file = 'db.sqlite3'
apps = ['students', 'accounting', 'core', 'inventory']

# 1. Delete DB
if os.path.exists(db_file):
    os.remove(db_file)
    print(f"Deleted {db_file}")

# 2. Delete Migrations
for app in apps:
    mig_dir = os.path.join(app, 'migrations')
    if os.path.exists(mig_dir):
        for f in glob.glob(os.path.join(mig_dir, "*.py")):
            if not f.endswith("__init__.py"):
                os.remove(f)
                print(f"Deleted {f}")
