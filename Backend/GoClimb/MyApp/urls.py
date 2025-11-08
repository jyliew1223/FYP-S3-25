from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [

    path("admin/", admin.site.urls),

    path("", views.home, name="home"),

    path("auth/", include("MyApp.Url.auth_url")),
    path("user/", include("MyApp.Url.user_url")),
    path("crag/", include("MyApp.Url.crag_url")),
    path("climb_log/", include("MyApp.Url.climblog_url")),
    path("crag_model/", include("MyApp.Url.cragmodel_url")),
    path("model_route_data/", include("MyApp.Url.modelroutedata_url")),
    path("post/", include("MyApp.Url.post_url")),
    path("comment/", include("MyApp.Url.post_comment_url")),
    path("route/", include("MyApp.Url.route_url")),

]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
