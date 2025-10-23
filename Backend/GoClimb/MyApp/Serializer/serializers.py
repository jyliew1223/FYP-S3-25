# MyApp/Serializer/serializers.py

from rest_framework import serializers
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.climblog import ClimbLog
from MyApp.Entity.post import Post
from MyApp.Entity.route import Route
from MyApp.Entity.post_likes import PostLike
from MyApp.Entity.crag_model import CragModel
from MyApp.Entity.model_route_data import ModelRouteData


class UserSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.ReadOnlyField(
        source="profile_picture_download_url"
    )

    class Meta:
        model = User

        fields = [
            "user_id",
            "username",
            "email",
            "status",
            "profile_picture",
            "profile_picture_url",
        ]

        read_only_fields = ["user_id", "profile_picture_url"]


class CragSerializer(serializers.ModelSerializer):
    crag_id = serializers.SerializerMethodField()  # return formatted_id
    images_urls = serializers.SerializerMethodField()

    class Meta:
        model = Crag
        fields = [
            "crag_id",  # formatted ID
            "name",
            "location_lat",
            "location_lon",
            "description",
            "images_urls",
        ]
        read_only_fields = ["crag_id", "images_urls"]

    def get_crag_id(self, obj):
        """Return the formatted ID instead of raw crag_id"""
        return obj.formatted_id

    def get_images_urls(self, obj):
        """Return a list of download URLs for the crag images"""
        urls = obj.images_download_urls
        if urls is None:
            return []
        return urls


class RouteSerializer(serializers.ModelSerializer):
    route_id = serializers.SerializerMethodField()
    images_urls = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = [
            "route_id",  # this will return formatted_id
            "route_name",
            "route_grade",
            "crag",
            "images_urls",
        ]
        read_only_fields = ["route_id", "images_urls"]

    def get_route_id(self, obj):
        return obj.formatted_id

    def get_images_urls(self, obj):
        urls = obj.images_download_urls
        if urls is None:
            return []
        return urls


class ClimbLogSerializer(serializers.ModelSerializer):
    log_id = serializers.SerializerMethodField()  # formatted ID
    user = UserSerializer(read_only=True)
    route = RouteSerializer(read_only=True)

    class Meta:
        model = ClimbLog
        fields = [
            "log_id",  # formatted
            "user",
            "route",
            "date_climbed",
            "notes",
        ]
        read_only_fields = ["log_id", "user", "route"]

    def get_log_id(self, obj):
        return obj.formatted_id


class PostSerializer(serializers.ModelSerializer):
    post_id = serializers.SerializerMethodField()
    images_urls = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "post_id",  # will return formatted_id
            "user",
            "content",
            "tags",
            "status",
            "created_at",
            "images_urls",
        ]
        read_only_fields = ["post_id", "created_at", "images_urls"]

    def get_post_id(self, obj):
        return obj.formatted_id

    def get_images_urls(self, obj):
        urls = obj.images_download_urls
        if urls is None:
            return []
        return urls


class PostLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostLike
        fields = [
            "id",  # automatically generated PK
            "post",
            "user",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CragModelSerializer(serializers.ModelSerializer):
    model_id = serializers.SerializerMethodField()  # return formatted_id
    user = UserSerializer(read_only=True)
    crag = CragSerializer(read_only=True)
    download_urls_json = serializers.SerializerMethodField()

    class Meta:
        model = CragModel
        fields = [
            "model_id",  # formatted
            "crag",
            "user",
            "status",
            "download_urls_json",
        ]
        read_only_fields = ["model_id", "crag", "user", "download_urls_json"]

    def get_model_id(self, obj):
        return obj.formatted_id

    def get_download_urls_json(self, obj):
        urls = obj.download_urls_json
        if urls is None:
            return {}
        return urls


class ModelRouteDataSerializer(serializers.ModelSerializer):
    model_route_data_id = (
        serializers.SerializerMethodField()
    )  # will return formatted_id
    user = UserSerializer(read_only=True)
    route = RouteSerializer(read_only=True)
    model = CragModelSerializer(read_only=True)  # optional
    route_data = serializers.JSONField()

    class Meta:
        model = ModelRouteData
        fields = [
            "model_route_data_id",  # formatted
            "model",
            "route",
            "user",
            "route_data",
            "status",
        ]
        read_only_fields = [
            "model_route_data_id",
            "user",
            "route",
            "model",
        ]

    def get_model_route_data_id(self, obj):
        return obj.formatted_id
