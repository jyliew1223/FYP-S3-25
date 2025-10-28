# MyApp/admin.py
from django.contrib import admin

# Register your models here.

from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.post import Post
from MyApp.Entity.climblog import ClimbLog
from MyApp.Entity.route import Route
from MyApp.Entity.post_likes import PostLike
from MyApp.Entity.model_route_data import ModelRouteData
from MyApp.Entity.crag_model import CragModel
from MyApp.Entity.post_comment import   PostComment
from django.contrib import admin, messages

admin.site.register(User)
admin.site.register(Crag)
# admin.site.register(Post)
admin.site.register(ClimbLog)
admin.site.register(Route)
# admin.site.register(PostLike)
admin.site.register(ModelRouteData)
admin.site.register(CragModel)
admin.site.register(PostComment)

# --------------------------
# ADMIN - 1, 2, 3, 4 (start)
# --------------------------

from django.urls import reverse
from django.utils.html import format_html
from django.http import HttpResponseRedirect

try:
    # If your friend’s PostLike model exists, we can optionally register it
    from MyApp.Entity.post_likes import PostLike  # noqa

    HAS_POSTLIKE = True
except Exception:
    HAS_POSTLIKE = False


# ------------ Helpers (admin-only) ------------


def _short_text(value: str, limit: int = 70) -> str:
    if not value:
        return ""
    return (value[: limit - 1] + "…") if len(value) > limit else value


# ------------ Post admin (Admin_01: Delete Post) ------------


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = (
        "formatted_id_admin",  # e.g. POST-123
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
        # Uses your model's `formatted_id` property
        try:
            return obj.formatted_id
        except Exception:
            return f"POST-{obj.pk}"

    @admin.display(description="Content")
    def short_content(self, obj: Post) -> str:
        return _short_text(obj.content)

    # Admin_01: Delete Post(s)
    def delete_selected_posts(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(
            request,
            f"{count} post(s) permanently deleted.",
            level=messages.SUCCESS,
        )

    delete_selected_posts.short_description = "Delete selected posts"


# # ------------ User admin
# # Admin_02: Suspend Profile (status=False)
# # Admin_03: Delete Profile (permanent delete)
# # Admin_04: View Member Posts (link to filtered Post changelist)
# # ------------


# @admin.register(User)
# class UserAdmin(admin.ModelAdmin):
#     list_display = (
#         "user_id",
#         "username",
#         "email",
#         "status",
#         "posts_count",
#         "view_posts_link",
#     )
#     list_filter = ["status"]
#     search_fields = ("username", "email", "user_id")
#     actions = ["suspend_selected_users", "delete_selected_users"]

#     # Admin_02: suspend
#     def suspend_selected_users(self, request, queryset):
#         updated = queryset.exclude(status=False).update(status=False)
#         self.message_user(
#             request,
#             f"{updated} user(s) suspended.",
#             level=messages.SUCCESS,
#         )

#     suspend_selected_users.short_description = "Suspend selected users"

#     # Admin_03: delete
#     def delete_selected_users(self, request, queryset):
#         count = queryset.count()
#         queryset.delete()
#         self.message_user(
#             request,
#             f"{count} user profile(s) permanently deleted.",
#             level=messages.SUCCESS,
#         )

#     delete_selected_users.short_description = "Delete selected users"

#     # Admin_04: quick link to view a member's posts
#     @admin.display(description="Member posts")
#     def view_posts_link(self, obj: User):
#         # Build the admin changelist URL for Post and pre-filter by this user
#         url_name = f"admin:{Post._meta.app_label}_{Post._meta.model_name}_changelist"
#         url = f"{reverse(url_name)}?user__id__exact={obj.pk}"
#         return format_html('<a href="{}">View posts</a>', url)

#     @admin.display(description="Posts")
#     def posts_count(self, obj: User) -> int:
#         # django related_name on Post.user is "post"
#         # (from your model: related_name="post")
#         return obj.post.count()


# # ------------ Optional: register PostLike if present ------------

# if HAS_POSTLIKE:

    @admin.register(PostLike)
    class PostLikeAdmin(admin.ModelAdmin):
        list_display = ("post", "user", "created_at")
        list_filter = ("created_at", "post", "user")
        search_fields = ("post__content", "user__email", "user__username")


# # ----------------------
# # ADMIN 1, 2, 3 ,4 (end)
# # ----------------------
