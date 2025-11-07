from django.contrib import admin

from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.post import Post
from MyApp.Entity.climblog import ClimbLog
from MyApp.Entity.route import Route
from MyApp.Entity.postlikes import PostLike
from MyApp.Entity.modelroutedata import ModelRouteData
from MyApp.Entity.cragmodel import CragModel
from MyApp.Entity.postcomment import PostComment
from django.contrib import admin, messages

admin.site.register(User)
admin.site.register(Crag)

admin.site.register(ClimbLog)
admin.site.register(Route)

admin.site.register(ModelRouteData)
admin.site.register(CragModel)
admin.site.register(PostComment)

from django.urls import reverse
from django.utils.html import format_html
from django.http import HttpResponseRedirect

try:

    from MyApp.Entity.postlikes import PostLike

    HAS_POSTLIKE = True
except Exception:
    HAS_POSTLIKE = False

def _short_text(value: str, limit: int = 70) -> str:
    if not value:
        return ""
    return (value[: limit - 1] + "…") if len(value) > limit else value

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = (
        "formatted_id_admin",
        "user",
        "short_content",
        "status",
        "created_at",
    )
    list_filter = ("status", "created_at", "user")
    search_fields = ("content", "user__username", "user__email")
    actions = ["delete_selected_posts"]

    @admin.display(description="Post ID")
    def formatted_id_admin(self, obj: Post) -> str:

        try:
            return obj.formatted_id
        except Exception:
            return f"POST-{obj.pk}"

    @admin.display(description="Content")
    def short_content(self, obj: Post) -> str:
        return _short_text(obj.content)

    def delete_selected_posts(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(
            request,
            f"{count} post(s) permanently deleted.",
            level=messages.SUCCESS,
        )

    delete_selected_posts.short_description = "Delete selected posts"

    @admin.register(PostLike)
    class PostLikeAdmin(admin.ModelAdmin):
        list_display = ("post", "user", "created_at")
        list_filter = ("created_at", "post", "user")
        search_fields = ("post__content", "user__email", "user__username")
