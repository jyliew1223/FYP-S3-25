import os
from django.core.management.base import BaseCommand
from django.conf import settings
from MyApp.Entity.user import User  # adjust to your User model

import firebase_admin
from firebase_admin import credentials, storage
import mimetypes


class Command(BaseCommand):
    help = "Upload profile pictures for all users to Firebase Storage with metadata"

    def handle(self, *args, **options):
        # ---------------------------
        # 1. Initialize Firebase
        # ---------------------------
        bucket = storage.bucket()

        # ---------------------------
        # 2. Loop through all users
        # ---------------------------
        users = User.objects.all()  # Query all users
        local_image_path = r"C:\Users\PC\Desktop\SIM Documents\CSIT321 Project\FYP\others\LOGO_V1\LOGO_ICON.png"
        mime_type, _ = mimetypes.guess_type(local_image_path)

        print(mime_type)  # "image/png"

        for user in users:
            blob = bucket.blob(f"users/{user.user_id}/profile_picture.png")
            metadata = {
                "uploadedBy": str(user.user_id),
                "username": user.full_name,
                "purpose": "profile_picture",
            }
            blob.upload_from_filename(local_image_path, content_type=mime_type)
            blob.metadata = metadata
            blob.patch()
            print(f"Uploaded for {user.full_name}")
