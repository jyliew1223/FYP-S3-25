# MyApp/Serializer/serializers.py

from rest_framework import serializers
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.climblog import ClimbLog
from MyApp.Entity.post import Post
from MyApp.Entity.category import Category


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "email", "profile_picture", "role", "status"]
        extra_kwargs = {
            "status": {"read_only": True},
        }


class CragSerializer(serializers.ModelSerializer):
    crag_id = serializers.SerializerMethodField()  # override to return formatted_id

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

    def get_crag_id(self, obj):
        return obj.formatted_id


class ClimbLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    crag = CragSerializer(read_only=True)
    log_id = serializers.SerializerMethodField()  # override to return formatted_id

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
            "log_id": {"read_only": True},
        }

    def get_log_id(self, obj):
        return obj.formatted_id


class PostSerializer(serializers.ModelSerializer):
    post_id = (
        serializers.SerializerMethodField()
    )  # override post_id to show formatted_id

    class Meta:
        model = Post
        fields = [
            "post_id",
            "user",
            "content",
            "tags",
            "image_urls",
            "status",
            "created_at",
        ]

    def get_post_id(self, obj):
        return obj.formatted_id


class CategorySerializer(serializers.ModelSerializer):
    category_id = serializers.SerializerMethodField()  # show formatted_id

    class Meta:
        model = Category
        fields = ["category_id", "name", "email", "description", "created_by"]

    def get_category_id(self, obj):
        return obj.formatted_id
