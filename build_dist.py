import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_cmd(cmd, cwd=None):
    print(f"Running: {' '.join(cmd)} (in {cwd or 'current dir'})")
    res = subprocess.run(cmd, cwd=cwd, shell=True)
    if res.returncode != 0:
        print(f"Error: command failed with exit code {res.returncode}", file=sys.stderr)
        sys.exit(res.returncode)

def main():
    root_dir = Path(__file__).resolve().parent
    venv_python = root_dir / 'venv' / 'Scripts' / 'python.exe'
    
    if not venv_python.exists():
        print(f"Error: Python virtual environment not found at {venv_python.parent.parent}", file=sys.stderr)
        sys.exit(1)
        
    print("=== Step 1: Install build dependencies ===")
    run_cmd([str(venv_python), '-m', 'pip', 'install', 'pyinstaller', 'waitress'])
    
    print("\n=== Step 2: Build React Frontend ===")
    frontend_dir = root_dir / 'frontend'
    if frontend_dir.exists():
        print("Installing npm packages and building...")
        run_cmd(['npm', 'install'], cwd=str(frontend_dir))
        run_cmd(['npm', 'run', 'build:firebase'], cwd=str(frontend_dir))
    else:
        print("Warning: frontend directory not found. Skipping frontend build.")
        
    print("\n=== Step 3: Run PyInstaller build ===")
    # Find all apps and template folders
    add_data_args = []
    
    # 1. Add frontend/dist if exists
    frontend_dist = root_dir / 'frontend' / 'dist'
    if frontend_dist.exists():
        add_data_args.append(f"--add-data=frontend/dist;frontend/dist")
        
    # 2. Add root templates
    root_templates = root_dir / 'templates'
    if root_templates.exists():
        add_data_args.append(f"--add-data=templates;templates")
        
    # 3. Scan for Django app templates/static
    django_apps = ['core', 'academics', 'accounting', 'inventory', 'staff', 'students']
    for app in django_apps:
        app_dir = root_dir / app
        if app_dir.exists():
            # Check for templates
            templates_dir = app_dir / 'templates'
            if templates_dir.exists():
                add_data_args.append(f"--add-data={app}/templates;{app}/templates")
            # Check for static
            static_dir = app_dir / 'static'
            if static_dir.exists():
                add_data_args.append(f"--add-data={app}/static;{app}/static")
                
    # List hidden imports to make sure PyInstaller bundles all Django components
    hidden_imports = [
        'waitress',
        'config.wsgi',
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        'rest_framework',
        'rest_framework.authtoken',
        'corsheaders',
        'corsheaders.middleware',
        'simple_history',
        'simple_history.middleware',
        'django_bootstrap5',
        'whitenoise',
        'whitenoise.middleware',
        'core',
        'students',
        'inventory',
        'accounting',
        'academics',
        'staff',
        'django.views.static',
        'psycopg2', # standard database adapter, even if unused locally
    ]
    
    hidden_import_args = [f"--hidden-import={imp}" for imp in hidden_imports]
    
    # Target executable name
    exe_name = "KadwelSchool"
    
    # PyInstaller execution command using venv's Python module
    venv_python = root_dir / 'venv' / 'Scripts' / 'python.exe'
    
    copy_metadata_packages = [
        'django-bootstrap5',
        'django-simple-history',
        'djangorestframework',
    ]
    copy_metadata_args = [f"--copy-metadata={pkg}" for pkg in copy_metadata_packages]

    pyinstaller_cmd = [
        str(venv_python),
        '-m',
        'PyInstaller',
        '--name=' + exe_name,
        '--noconfirm',
        '--onedir',
        '--clean',
        '--log-level=INFO',
    ] + add_data_args + hidden_import_args + copy_metadata_args + ['run_app.py']
    
    run_cmd(pyinstaller_cmd, cwd=str(root_dir))
    
    print("\n=== Step 4: Finalize distribution package ===")
    dist_dir = root_dir / 'dist'
    app_dist_dir = dist_dir / exe_name
    
    # Copy README.txt instructions to the final package folder
    readme_src = root_dir / 'README.txt'
    readme_dest = app_dist_dir / 'README.txt'
    
    # Write a clean README.txt
    readme_content = """Kadwel School Management System - Standalone Deployment
======================================================

To run the application:
1. Double-click the 'KadwelSchool.exe' file.
2. A command line window will open, and your default web browser will automatically load the login screen.
3. You can log in using:
   - Super Administrator: admin / password123
   - Chairman: chairman / password123

Application Data:
- The database file 'db.sqlite3' and uploaded documents 'media/' will be saved and managed in this folder.
- Do not delete or rename the folders/files in this directory.

Support:
- Powered by Kadwel School Management System.
"""
    
    with open(readme_src, 'w') as f:
        f.write(readme_content)
        
    if app_dist_dir.exists():
        shutil.copy(str(readme_src), str(readme_dest))
        print(f"Copied README to {readme_dest}")
        
        # Ensure staticfiles directory exists in bundle to silence WhiteNoise startup warning
        staticfiles_dir = app_dist_dir / '_internal' / 'staticfiles'
        staticfiles_dir.mkdir(parents=True, exist_ok=True)
        print("Created staticfiles placeholder directory inside _internal.")
        
    print("\nBuild complete! Distributable package is located at:")
    print(app_dist_dir.resolve())

if __name__ == '__main__':
    main()
