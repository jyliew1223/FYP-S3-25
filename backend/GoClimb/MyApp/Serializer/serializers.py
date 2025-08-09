# MyApp/Serializer/serializers.py

from rest_framework import serializers
from MyApp.Entity.user import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['user_id', 'full_name', 'email', 'password', 'profile_picture', 'role', 'status']
        extra_kwargs = {
            'user_id': {'read_only': True},
            'status': {'read_only': True},
        }
