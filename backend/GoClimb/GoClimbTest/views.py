# Create your views here.

# Normal Django view Example
from django.http import HttpResponse


def hello_world_Django(request):
    return HttpResponse("Hello Django!")


# Django with Rest Framework view Example
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def hello_world_REST(request):
    data = {
        "message": "Hello from the Gjango REST API!",
    }
    return Response(data)


####################################
# BCE Framework with Django Example
####################################
#
# This will demonstrate how to implement
# a simple Boundary-Control-Entity (BCE) framework
#
# And also example of using Django ORM
# to manage entities and controllers.
#
####################################


# Entity Example
class UserX:
    def __init__(self, user_id, username, email):
        self.user_id = user_id
        self.username = username
        self.email = email

    def change_email(self, new_email):
        self.email = new_email
        return self


# Controller Example
class UserControllerX:
    # Normally, you would have some kind of storage or repository here.
    # For demo, using a simple in-memory dict to simulate users.
    _users = {
        1: UserX(1, "alice", "alice@example.com"),
        2: UserX(2, "bob", "bob@example.com"),
    }

    def update_email(self, user_id, new_email):
        user = self._users.get(user_id)
        if not user:
            raise ValueError("User not found")
        user.change_email(new_email)
        return user


# Boundary Example (Django view)
from django.http import JsonResponse

user_controller = UserControllerX()


def update_email_view(request, user_id):
    if request.method == "POST":
        new_email = request.POST.get("email")
        try:
            user = user_controller.update_email(int(user_id), new_email)
            return JsonResponse(
                {"status": "success", "username": user.username, "email": user.email}
            )
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)
    else:
        return JsonResponse(
            {"status": "error", "message": "Invalid HTTP method"}, status=405
        )


# Entity Example with Django ORM
"""Gjango ORM is a feature provided by Django 
that allows you to interact with your database 
using Python code instead of SQL queries. 
It provides a high-level abstraction for database operations, 
making it easier to work with data models."""
from django.db import models


class UserY(models.Model):
    username = models.CharField(max_length=100)
    email = models.EmailField()

    def change_email(self, new_email):
        self.email = new_email
        self.save()


# Controller Example with Django ORM
class UserControllerY:
    def update_email(self, user_id, new_email):
        try:
            user = UserY.objects.get(pk=user_id)
        except UserY.DoesNotExist:
            raise ValueError("User not found")

        user.change_email(new_email)
        return user


# Boundary Example with Django ORM
user_controller = UserControllerY()


def update_email_ORMview(request, user_id):
    if request.method == "POST":
        new_email = request.POST.get("email")
        try:
            user = user_controller.update_email(user_id, new_email)
            return JsonResponse(
                {"status": "success", "username": user.username, "email": user.email}
            )
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)
    else:
        return JsonResponse(
            {"status": "error", "message": "Invalid HTTP method"}, status=405
        )


####################################
# Below is for testing purposes only
####################################

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
