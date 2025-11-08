from typing import Any, Dict
from rest_framework.request import Request

import firebase_admin
from firebase_admin import auth, credentials


def verify_id_token(id_token: str) -> Dict[str, Any]:

    if not id_token or not isinstance(id_token, str):
        return {
            "success": False,
            "message": "Invalid token format.",
            "errors": {"id_token": "Token must be a non-empty string."},
        }

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token.get("uid")

        if not uid:
            return {
                "success": False,
                "message": "Token verified but UID not found.",
                "errors": {"uid": "Missing UID in decoded token."},
            }

        return {
            "success": True,
            "uid": uid,
            "message": "Token verified successfully.",
            "errors": {},
        }

    except auth.ExpiredIdTokenError:
        return {
            "success": False,
            "message": "Token has expired.",
            "errors": {"id_token": "Expired token."},
        }
    except auth.InvalidIdTokenError:
        return {
            "success": False,
            "message": "Invalid token.",
            "errors": {"id_token": "Token is not valid."},
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to verify token: {str(e)}",
            "errors": {},
        }


class PrefixedIDConverter:
    @staticmethod
    def to_raw_id(prefixed_id: str) -> int:
        if not prefixed_id:
            raise ValueError(f"prefixed_id is null")
        if "-" not in prefixed_id:
            try:
                id = int(prefixed_id)
                return id
            except:
                raise ValueError(f"not - found Invalid ID format: {prefixed_id}")
        parts = prefixed_id.split("-")
        if len(parts) != 2:
            raise ValueError(f"len of part !=2 Invalid ID format: {prefixed_id}")
        try:
            return int(parts[1])
        except ValueError:
            raise ValueError(f"Invalid numeric part in ID: {prefixed_id}")


def extract_files_and_clean_data(request: Request, file_field_name: str = "images"):
    """
    Extract files and clean form data to make it compatible with normal serializer usage.

    This function handles the common issue where multipart form data values come as lists
    instead of strings, which causes serializer validation errors.

    Args:
        request: Django request object
        file_field_name: Name of the file field (default: "images")

    Returns:
        tuple: (files_list, clean_data_dict)

    Example:
        files, clean_data = extract_files_and_clean_data(request)
        serializer = MySerializer(data=clean_data)
    """
    # Extract files
    files = request.FILES.getlist(file_field_name) if hasattr(request, "FILES") else []

    # Clean form data for serializer
    # Check if this is multipart data (either has files OR form data with list values)
    is_multipart = hasattr(request, "FILES") and request.FILES

    if is_multipart:
        # Multipart form data - clean the values
        clean_data = {}

        for key, value in request.data.items():
            # Skip file fields
            if key == file_field_name:
                continue

            # Handle values that might come as lists in multipart
            if isinstance(value, list) and len(value) > 0:
                clean_data[key] = str(value[0]).strip()
            else:
                clean_data[key] = str(value).strip() if value is not None else ""

        # Handle tags specially (can be JSON string or comma-separated)
        if "tags" in clean_data and clean_data["tags"]:
            try:
                import json

                clean_data["tags"] = json.loads(clean_data["tags"])
            except:
                # Split by comma if not valid JSON
                clean_data["tags"] = [
                    tag.strip() for tag in clean_data["tags"].split(",") if tag.strip()
                ]
    else:
        # JSON data - use as is
        clean_data = request.data if isinstance(request.data, dict) else {}

    return files, clean_data


def extract_single_file_and_clean_data(
    request: Request, file_field_name: str = "image"
):
    """
    Extract a single file and clean form data for endpoints that handle single file uploads.

    Args:
        request: Django request object
        file_field_name: Name of the file field (default: "image")

    Returns:
        tuple: (file_object_or_none, clean_data_dict)

    Example:
        image_file, clean_data = extract_single_file_and_clean_data(request, "profile_picture")
    """
    files, clean_data = extract_files_and_clean_data(request, file_field_name)

    # Return single file or None
    single_file = files[0] if files else None

    return single_file, clean_data
