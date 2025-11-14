from rest_framework import serializers
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.climblog import ClimbLog
from MyApp.Entity.post import Post
from MyApp.Entity.route import Route
from MyApp.Entity.postlikes import PostLike
from MyApp.Entity.cragmodel import CragModel
from MyApp.Entity.modelroutedata import ModelRouteData

from MyApp.Utils.helper import PrefixedIDConverter

class FormattedPKRelatedField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):

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

        read_only_fields = ["profile_picture_url"]

class CragSerializer(serializers.ModelSerializer):
    crag_id = serializers.SerializerMethodField()
    images_urls = serializers.SerializerMethodField()
    location_details = serializers.JSONField()
    user = UserSerializer(read_only=True)
    user_id = FormattedPKRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )

    class Meta:
        model = Crag
        fields = [
            "crag_id",
            "name",
            "location_lat",
            "location_lon",
            "location_details",
            "description",
            "images_urls",
            "user",
            "user_id",
        ]
        read_only_fields = ["crag_id", "images_urls", "user"]

    def get_crag_id(self, obj):

        return obj.formatted_id

    def get_images_urls(self, obj):

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
    user_id = FormattedPKRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )

    route_id = serializers.SerializerMethodField()
    images_urls = serializers.SerializerMethodField()
    crag = CragSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Route
        fields = [
            "route_id",
            "route_name",
            "route_grade",
            "crag",
            "images_urls",
            "user",
            "crag_id",
            "user_id",
        ]
        read_only_fields = ["route_id", "images_urls", "crag", "user"]

    def get_route_id(self, obj):
        return obj.formatted_id

    def get_images_urls(self, obj):
        urls = obj.images_download_urls
        if urls is None:
            return []
        return urls

class ClimbLogSerializer(serializers.ModelSerializer):
    log_id = serializers.SerializerMethodField()

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
            "log_id",
            "user",
            "route",
            "date_climbed",
            "notes",
            "title",
            "status",
            "attempt",
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
            "post_id",
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
            "id",
            "post",
            "user",
            "created_at",
            "post_id",
            "user_id",
        ]
        read_only_fields = ["id", "created_at", "post", "user"]

class CragModelSerializer(serializers.ModelSerializer):
    model_id = serializers.SerializerMethodField()

    user = UserSerializer(read_only=True)
    crag = CragSerializer(read_only=True)

    user_id = FormattedPKRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )
    crag_id = FormattedPKRelatedField(
        source="crag", queryset=Crag.objects.all(), write_only=True
    )

    download_urls_json = serializers.SerializerMethodField()
    normalization_data = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = CragModel
        fields = [
            "model_id",
            "name",
            "crag",
            "user",
            "status",
            "download_urls_json",
            "normalization_data",
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
    )

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
            "model_route_data_id",
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

from MyApp.Entity.postcomment import PostComment

# Ranking Serializers
class WeeklyRankingSerializer(serializers.Serializer):
    user = UserSerializer(read_only=True)
    rank = serializers.IntegerField()
    total_routes = serializers.IntegerField()


class AlltimeRankingSerializer(serializers.Serializer):
    user = UserSerializer(read_only=True)
    rank = serializers.IntegerField()
    total_routes = serializers.IntegerField()


class AverageGradeRankingSerializer(serializers.Serializer):
    user = UserSerializer(read_only=True)
    rank = serializers.IntegerField()
    average_grade = serializers.FloatField()
    total_routes = serializers.IntegerField()


class TopClimbersSerializer(serializers.Serializer):
    user = UserSerializer(read_only=True)
    rank = serializers.IntegerField()
    total_score = serializers.IntegerField()
    total_routes = serializers.IntegerField()
    average_grade = serializers.FloatField()


class PostCommentSerializer(serializers.ModelSerializer):
    comment_id = serializers.SerializerMethodField()

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
            "comment_id",
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
