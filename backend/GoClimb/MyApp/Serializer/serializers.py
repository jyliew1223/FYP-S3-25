# MyApp/Serializer/serializers.py

from rest_framework import serializers
from MyApp.Entity.user import User

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['full_name', 'email']
        extra_kwargs = {
            'user_id': {'read_only': True},
            'status': {'read_only': True},
        }
