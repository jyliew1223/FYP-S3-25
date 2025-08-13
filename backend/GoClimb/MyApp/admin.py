# MyApp/admin.py
from django.contrib import admin

# Register your models here.

from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.post import Post
from MyApp.Entity.climblog import ClimbLog

admin.site.register(User)
admin.site.register(Crag)
admin.site.register(Post)
admin.site.register(ClimbLog)
