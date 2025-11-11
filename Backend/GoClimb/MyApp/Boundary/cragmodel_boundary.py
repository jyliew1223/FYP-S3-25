from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist

from MyApp.Controller import cragmodel_controller
from MyApp.Serializer.serializers import CragModelSerializer
from MyApp.Firebase.helpers import authenticate_app_check_token
from MyApp.Utils.helper import extract_files_and_clean_data


@api_view(["GET"])
def get_models_by_crag_id_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    crag_id = request.query_params.get("crag_id", "").strip()
    if not crag_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"crag_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        models_qs = cragmodel_controller.get_models_by_crag_id(crag_id)

        if models_qs is None:
            return Response(
                {
                    "success": False,
                    "message": "Crag not found.",
                    "errors": {"crag_id": "Invalid ID."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CragModelSerializer(models_qs, many=True)

        return Response(
            {
                "success": True,
                "message": "Models fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"crag_id": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching models.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["POST"])
def create_crag_model_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to create a crag model.
    Supports both file uploads and Google Drive URLs.
    
    INPUT (Form Data or JSON): {
        "user_id": str (required),
        "crag_id": str (required),
        "name": str (optional),
        "status": str (optional, default: "active"),
        "model_files": zip files (optional) - Zipped 3D model folders
        "google_drive_url": str (optional) - Google Drive share URL for model files
    }
    
    Note: If both model_files and google_drive_url are provided, google_drive_url takes priority.
    
    OUTPUT: {
        "success": bool,
        "message": str,
        "data": CragModel object,
        "errors": dict  # Only if success is False
    }
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    # Handle both form data and JSON data
    model_files = None
    clean_data = {}
    google_drive_url = ""
    
    # Check content type to determine how to parse data
    content_type = request.content_type or ""
    
    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        # Handle form data (file uploads)
        model_files, clean_data = extract_files_and_clean_data(request, "model_files")
        google_drive_url = clean_data.get("google_drive_url", "").strip()
        if google_drive_url:
            clean_data.pop("google_drive_url", None)
    else:
        # Handle JSON data
        try:
            data = request.data
            clean_data = {k: v for k, v in data.items() if k != "google_drive_url"}
            google_drive_url = data.get("google_drive_url", "").strip()
        except Exception:
            return Response(
                {
                    "success": False,
                    "message": "Invalid request data.",
                    "errors": {"data": "Request body must be valid JSON or form data."},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
    
    # Basic validation
    user_id = clean_data.get("user_id", "").strip() if isinstance(clean_data.get("user_id"), str) else str(clean_data.get("user_id", ""))
    crag_id = clean_data.get("crag_id", "").strip() if isinstance(clean_data.get("crag_id"), str) else str(clean_data.get("crag_id", ""))
    
    if not user_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"user_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not crag_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"crag_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate that either zip files or Google Drive URL is provided
    if not model_files and not google_drive_url:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"files": "Either model_files (zip) or google_drive_url must be provided."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate Google Drive URL format if provided
    if google_drive_url and "drive.google.com" not in google_drive_url:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"google_drive_url": "Must be a valid Google Drive URL."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        crag_model = cragmodel_controller.create_crag_model(
            user_id, 
            clean_data, 
            model_files, 
            google_drive_url if google_drive_url else None
        )

        serializer = CragModelSerializer(crag_model)

        # Determine success message based on upload method
        if google_drive_url:
            message = "Crag model created successfully from Google Drive."
        else:
            message = "Crag model created successfully from uploaded files."

        return Response(
            {
                "success": True,
                "message": message,
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input or upload error.",
                "errors": {"validation": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except ObjectDoesNotExist:
        return Response(
            {
                "success": False,
                "message": "User not found.",
                "errors": {"user_id": "Invalid user ID."},
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while creating crag model.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )