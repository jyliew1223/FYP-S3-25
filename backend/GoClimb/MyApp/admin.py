# MyApp/admin.py
from django.contrib import admin

# Register your models here.

from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.post import Post
from MyApp.Entity.climblog import ClimbLog
from django.contrib import admin
from django.contrib.admin import AdminSite

class MyAdminSite(AdminSite):
    site_header = "GoClimb Admin"
    site_title = "GoClimb Admin Portal"
    index_title = "Welcome to GoClimb Admin"

    class Media:
        css = {
            'all': ('MyApp/css/default.css',)
        }

admin_site = MyAdminSite(name='myadmin')
admin_site.register(User)
admin_site.register(Crag)
admin_site.register(Post)
admin_site.register(ClimbLog)
