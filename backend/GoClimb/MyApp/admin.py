# MyApp/admin.py
from django.contrib import admin

# Register your models here.

from .Entity.user_model import User

admin.site.register(User)