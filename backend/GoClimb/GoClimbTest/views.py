from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse


def hello_world(request):
    return HttpResponse("Hello, World!")


from firebase_admin import auth
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["POST"])
def login_or_signup(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Missing email or password"}, status=400)

    try:
        user = auth.get_user_by_email(email)
    except auth.UserNotFoundError:
        user = auth.create_user(email=email, password=password)

    # Create custom token
    custom_token = auth.create_custom_token(user.uid)
    return Response({"custom_token": custom_token.decode("utf-8")})
