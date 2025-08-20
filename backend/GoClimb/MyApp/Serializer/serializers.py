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




### Wei Rong edit crag ###
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
### wei rong END edit ####