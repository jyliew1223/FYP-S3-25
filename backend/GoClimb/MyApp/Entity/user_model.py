# MyApp/Entity/user_model.py

from django.db import models

class User(models.Model):
    user_id = models.CharField(primary_key=True, max_length=255)  # VARCHAR with no length specified, set max_length reasonably
    full_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True, max_length=255)
    profile_picture = models.URLField(max_length=2083, blank=True, null=True)
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    status = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'user'
        managed = False 
        
    def __str__(self):
        return self.full_name
