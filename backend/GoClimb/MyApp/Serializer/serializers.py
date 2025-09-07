# MyApp/Serializer/serializers.py

from rest_framework import serializers
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['full_name', 'email']
        extra_kwargs = {
            'user_id': {'read_only': True},
            'status': {'read_only': True},
        }




### Wei Rong edit crag ###

 # Crag Information
class CragSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crag
        # Include fields you want to expose in the API
        fields = [
            'id',             # or crag_id if that is the PK
            'name',
            'location',
            'difficulty',
            'description',
            # add any other relevant fields here
        ]
        
        
        
# Crag trending info
class CragSerializer(serializers.ModelSerializer):
    current_count = serializers.IntegerField(read_only=True)
    previous_count = serializers.IntegerField(read_only=True)
    growth = serializers.IntegerField(read_only=True)
    growth_rate = serializers.FloatField(read_only=True)
    ranking = serializers.IntegerField(read_only=True)

    class Meta:
        model = Crag
        fields = [
            'id',         
            'name',
            'location',
            'difficulty',
            'description',
            # trending fields
            'current_count',
            'previous_count',
            'growth',
            'growth_rate',
            'ranking',
        ]       
        
class ClimbLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Climb
        fields = [
            'id',               # will be mapped to log_id in response
            'crag_id',
            'user_id',
            'route_name',
            'climb_date',       # ISO 8601 from DRF serializer
            'difficulty_grade',
            'note',
        ]
        read_only_fields = fields       
        
### wei rong END edit ####