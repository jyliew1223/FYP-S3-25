# MyApp/Serializer/serializers.py

from rest_framework import serializers
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.models import Climb  # Climb stays in models.py


# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'full_name', 'email', 'profile_picture', 'role', 'status']
        extra_kwargs = {
            'user_id': {'read_only': True},
            'status': {'read_only': True},
        }


# Crag Serializer with dynamic counts
class CragSerializer(serializers.ModelSerializer):
    current_count = serializers.SerializerMethodField()
    previous_count = serializers.SerializerMethodField()
    growth = serializers.SerializerMethodField()
    growth_rate = serializers.SerializerMethodField()
    ranking = serializers.SerializerMethodField()

    class Meta:
        model = Crag
        fields = [
            'crag_id',
            'name',
            'location_lat',
            'location_lon',
            'description',
            'image_urls',
            'current_count',
            'previous_count',
            'growth',
            'growth_rate',
            'ranking',
        ]

    def get_current_count(self, obj):
        from django.utils import timezone
        year = timezone.now().year
        return Climb.objects.filter(crag_id=obj.crag_id, date_climbed__year=year).count()

    def get_previous_count(self, obj):
        from django.utils import timezone
        year = timezone.now().year - 1
        return Climb.objects.filter(crag_id=obj.crag_id, date_climbed__year=year).count()

    def get_growth(self, obj):
        return self.get_current_count(obj) - self.get_previous_count(obj)

    def get_growth_rate(self, obj):
        previous = self.get_previous_count(obj)
        if previous == 0:
            return 0.0
        return self.get_growth(obj) / previous * 100

    def get_ranking(self, obj):
        # Placeholder: ranking logic can be implemented as needed
        return 0


# Climb Log Serializer
class ClimbLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Climb
        fields = [
            'id',
            'name',
            'crag',
            'date_climbed',
        ]
