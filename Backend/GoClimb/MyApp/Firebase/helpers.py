# MyApp/Firebase/helpers.py

from typing import Any, Dict
from firebase_admin import auth, exceptions, app_check, storage
from datetime import timedelta
from rest_framework.request import Request
import json


def verify_id_token(id_token: str) -> dict[str, Any]:
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token.get("uid")

        return {
            "success": True,
            "message": "User verified successfully",
            "data": {
                "user_id": uid,
            },
        }
    except exceptions.FirebaseError as e:
        return {"success": False, "message": f"Firebase error: {str(e)}"}
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}


def verify_app_check_token(app_check_token) -> dict[str, Any]:
    """
    Verifies a Firebase App Check token using the Firebase Admin SDK.

    Args:
        app_check_token()
    """
    try:
        decoded_token = app_check.verify_token(app_check_token)
        return {
            "success": True,
            "message": "App Check token verified successfully",
        }
    except exceptions.FirebaseError as e:
        return {"success": False, "message": f"Firebase error: {str(e)}"}
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}


def authenticate_app_check_token(request: Request) -> Dict[str, Any]:
    """
    Extracts the Firebase App Check token from headers and verifies it.
    """
    app_check_token = request.headers.get("X-Firebase-AppCheck")

    if not app_check_token:
        return {"success": False, "message": "Missing App Check token"}

    verification_result = verify_app_check_token(app_check_token)
    if not verification_result.get("success"):
        return {"success": False, "message": verification_result.get("message")}

    return {
        "success": True,
        "message": "Request authorized",
        "data": {
            "token_info": verification_result.get("token_info"),
        },
    }


def delete_bucket_folder(bucket_folder) -> None:
    """
    Delete all files under the given folder in Firebase Storage.
    Args:
        bucket_folder (str): Path to the folder in the bucket, e.g., "users/abc123/images/"
    """
    bucket = storage.bucket()

    blobs = bucket.list_blobs(prefix=bucket_folder)

    for blob in blobs:
        blob.delete()
        print(f"Deleted: {blob.name}")

    print(f"All files in folder '{bucket_folder}' have been deleted.")


def get_download_url(file_path, expires_in_hours=1) -> str:
    """
    Returns a signed download URL for a file in Firebase Storage.

    Args:
        file_path (str): Path to the file in the bucket, e.g., "users/abc123/images/avatar.png"
        expires_in_hours (int): How long the URL is valid (default 1 hour)

    Returns:
        str: The signed URL
    """
    bucket = storage.bucket()
    blob = bucket.blob(file_path)

    if not blob.exists():
        raise FileNotFoundError(f"File '{file_path}' does not exist in the bucket.")

    url = blob.generate_signed_url(expiration=timedelta(hours=expires_in_hours))
    return url


def get_download_urls_json_in_folder(folder_path, expiry_minutes=15):
    """
    Lists all files in a Firebase Storage folder and returns JSON data
    with name, path, and signed download URL.
    """
    bucket = storage.bucket()

    # Ensure folder_path ends with "/"
    if not folder_path.endswith("/"):
        folder_path += "/"

    # List blobs in the folder
    blobs = bucket.list_blobs(prefix=folder_path)

    files = []
    for blob in blobs:
        # Skip "folders" themselves
        if blob.name.endswith("/"):
            continue

        # Generate signed URL (valid for expiry_minutes)
        url = blob.generate_signed_url(expiration=timedelta(minutes=expiry_minutes))

        files.append(
            {"name": blob.name.split("/")[-1], "path": blob.name, "download_url": url}
        )

    result = {"folder": folder_path, "files": files}

    return result


def get_download_urls_in_folder(folder_path, expiry_minutes=15) -> list:
    """
    Lists all files in a Firebase Storage folder in a list
    """
    bucket = storage.bucket()

    # Ensure folder_path ends with "/"
    if not folder_path.endswith("/"):
        folder_path += "/"

    # List blobs in the folder
    blobs = bucket.list_blobs(prefix=folder_path)

    files = []
    for blob in blobs:
        # Skip "folders" themselves
        if blob.name.endswith("/"):
            continue

        # Generate signed URL (valid for expiry_minutes)
        url = blob.generate_signed_url(expiration=timedelta(minutes=expiry_minutes))

        files.append(url)

    return files


# ------------------------
# ADMIN 1, 2, 3, 4 (start)
# ------------------------

from typing import Optional


def parse_prefixed_int(value, prefix: str) -> Optional[int]:
    """
    Accepts plain int (123) or 'PREFIX-123' (case-sensitive).
    Returns int or None if invalid.
    """
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        value = value.strip()
        if value.isdigit():
            return int(value)
        if value.startswith(f"{prefix}-"):
            tail = value[len(prefix) + 1 :]
            if tail.isdigit():
                return int(tail)
    return None


# ----------------------
# ADMIN 1, 2, 3, 4 (end)
# ----------------------
