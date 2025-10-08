from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # Home / Landing
    path("", views.home, name="home"),

    # Categories
    path("auth/", include("MyApp.Url.auth_url")),
    path("user/", include("MyApp.Url.user_url")),
    path("crag/", include("MyApp.Url.crag_url")),
    path("climb_log/", include("MyApp.Url.climb_log_url")),
    path("post/", include("MyApp.Url.post_url")), 
    path("api/admin/", include("MyApp.Url.admin_urls")),   # ADMIN - 2
]

# Static (development only)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
