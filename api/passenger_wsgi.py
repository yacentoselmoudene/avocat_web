import os, sys
sys.path.insert(0, '/home/lrsmfma/lmohamiProject')  # 
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'avocat.settings')  # your project is named "api"
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()