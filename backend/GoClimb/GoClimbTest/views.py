from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse

def hello_world(request):
    return HttpResponse("Hello, World!")

# auth/views.py
from firebase_admin import credentials, auth, initialize_app
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

import firebase_admin

# Only initialize once
if not firebase_admin._apps:
    cred = credentials.Certificate("secrets/firebase-key.json")
    initialize_app(cred)

@api_view(['POST'])
def login_or_signup(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({"error": "Missing email or password"}, status=400)

    try:
        user = auth.get_user_by_email(email)
    except auth.UserNotFoundError:
        user = auth.create_user(email=email, password=password)

    # Create custom token
    custom_token = auth.create_custom_token(user.uid)
    return Response({"custom_token": custom_token.decode('utf-8')})
