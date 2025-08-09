# MyApp/admin.py
from django.contrib import admin

# Register your models here.

from MyApp.Entity.user import User

admin.site.register(User)