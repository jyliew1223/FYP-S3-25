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


from MyApp.Utils.helper import PrefixedIDConverter


class FormattedPKRelatedField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        # convert formatted ID like "POST-000002" -> raw int 2
        if isinstance(data, str) and "-" in data:
            try:
                raw_id = PrefixedIDConverter.to_raw_id(data)
                return super().to_internal_value(raw_id)
            except ValueError:
                raise serializers.ValidationError("Invalid formatted ID")
        return super().to_internal_value(data)


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
    location_details = serializers.JSONField()

    class Meta:
        model = Crag
        fields = [
            "crag_id",  # formatted ID
            "name",
            "location_lat",
            "location_lon",
            "location_details",
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

    def get_location_details(self, obj):
        return obj.location_details


class RouteSerializer(serializers.ModelSerializer):
    crag_id = FormattedPKRelatedField(
        source="crag", queryset=Crag.objects.all(), write_only=True
    )

    route_id = serializers.SerializerMethodField()
    images_urls = serializers.SerializerMethodField()
    crag = CragSerializer(read_only=True)

    class Meta:
        model = Route
        fields = [
            "route_id",  # this will return formatted_id
            "route_name",
            "route_grade",
            "crag",
            "images_urls",
            "crag_id",
        ]
        read_only_fields = ["route_id", "images_urls", "crag"]

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

    user_id = FormattedPKRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )
    route_id = FormattedPKRelatedField(
        source="route", queryset=Route.objects.all(), write_only=True
    )

    class Meta:
        model = ClimbLog
        fields = [
            "log_id",  # formatted
            "user",
            "route",
            "date_climbed",
            "notes",
            "user_id",
            "route_id",
        ]
        read_only_fields = ["log_id", "user", "route"]

    def get_log_id(self, obj):
        return obj.formatted_id


class PostSerializer(serializers.ModelSerializer):
    post_id = serializers.SerializerMethodField()

    user = UserSerializer(read_only=True)
    user_id = FormattedPKRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )

    images_urls = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "post_id",  # will return formatted_id
            "user",
            "title",
            "content",
            "tags",
            "status",
            "created_at",
            "images_urls",
            "user_id",
        ]
        read_only_fields = ["post_id", "created_at", "images_urls", "user"]

    def get_post_id(self, obj):
        return obj.formatted_id

    def get_images_urls(self, obj):
        urls = obj.images_download_urls
        if urls is None:
            return []
        return urls


class PostLikeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    post = PostSerializer(read_only=True)

    user_id = FormattedPKRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )
    post_id = FormattedPKRelatedField(
        source="post", queryset=Post.objects.all(), write_only=True
    )

    class Meta:
        model = PostLike
        fields = [
            "id",  # automatically generated PK
            "post",
            "user",
            "created_at",
            "post_id",
            "user_id",
        ]
        read_only_fields = ["id", "created_at", "post", "user"]


class CragModelSerializer(serializers.ModelSerializer):
    model_id = serializers.SerializerMethodField()  # return formatted_id

    user = UserSerializer(read_only=True)
    crag = CragSerializer(read_only=True)

    user_id = FormattedPKRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )
    crag_id = FormattedPKRelatedField(
        source="crag", queryset=Crag.objects.all(), write_only=True
    )

    download_urls_json = serializers.JSONField()

    class Meta:
        model = CragModel
        fields = [
            "model_id",  # formatted
            "crag",
            "user",
            "status",
            "download_urls_json",
            "user_id",
            "crag_id",
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
    model = CragModelSerializer(read_only=True)

    user_id = FormattedPKRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )
    route_id = FormattedPKRelatedField(
        source="route", queryset=Route.objects.all(), write_only=True
    )
    model_id = FormattedPKRelatedField(
        source="model", queryset=CragModel.objects.all(), write_only=True
    )

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
            "user_id",
            "route_id",
            "model_id",
        ]
        read_only_fields = [
            "model_route_data_id",
            "user",
            "route",
            "model",
        ]

    def get_model_route_data_id(self, obj):
        return obj.formatted_id


from MyApp.Entity.post_comment import PostComment


class PostCommentSerializer(serializers.ModelSerializer):
    comment_id = serializers.SerializerMethodField()  # will return formatted_id

    post = PostSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    user_id = FormattedPKRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )
    post_id = FormattedPKRelatedField(
        source="post", queryset=Post.objects.all(), write_only=True
    )

    class Meta:
        model = PostComment
        fields = [
            "comment_id",  # formatted
            "post",
            "user",
            "content",
            "created_at",
            "user_id",
            "post_id",
        ]
        read_only_fields = [
            "comment_id",
            "post",
            "user",
        ]

    def get_comment_id(self, obj):
        return obj.formatted_id
