# MyApp/Serializer/serializers.py

from rest_framework import serializers
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.climblog import ClimbLog

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'full_name', 'email', 'profile_picture', 'role', 'status']
        extra_kwargs = {
            'user_id': {'read_only': True},
            'status': {'read_only': True},
        }
        
class CragSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crag
        fields = [
            "crag_id",
            "name",
            "location_lat",
            "location_lon",
            "description",
            "image_urls",
        ]

class ClimbLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # or use UserSerializer if you have one
    crag = CragSerializer(read_only=True)

    class Meta:
        model = ClimbLog
        fields = [
            "log_id",
            "user",
            "crag",
            "route_name",
            "date_climbed",
            "difficulty_grade",
            "notes",
        ]
        extra_kwargs = {
            'log_id': {'read_only': True},
        }