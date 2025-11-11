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
    
    INPUT (Form Data): {
        "user_id": str (required),
        "crag_id": str (required),
        "name": str (optional),
        "status": str (optional, default: "active"),
        "model_files": zip files (required) - Zipped 3D model folders
    }
    
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

    # Extract model files and clean form data
    model_files, clean_data = extract_files_and_clean_data(request, "model_files")
    
    # Basic validation
    user_id = clean_data.get("user_id", "")
    crag_id = clean_data.get("crag_id", "")
    
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

    # Validate that zip files are provided
    if not model_files:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"files": "model_files (zip) is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        crag_model = cragmodel_controller.create_crag_model(
            user_id, 
            clean_data, 
            model_files
        )

        serializer = CragModelSerializer(crag_model)

        return Response(
            {
                "success": True,
                "message": "Crag model created successfully from uploaded zip files.",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input or zip upload error.",
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


@api_view(["DELETE"])
def delete_crag_model_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to delete a crag model.
    
    INPUT: {
        "model_id": str (required) - Can be formatted (MODEL-000001) or raw (1)
        "user_id": str (required)
    }
    OUTPUT: {
        "success": bool,
        "message": str,
        "errors": dict  # Only if success is False
    }
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    # Get data from request body or query params
    model_id = request.data.get("model_id") or request.query_params.get("model_id", "").strip()
    user_id = request.data.get("user_id") or request.query_params.get("user_id", "").strip()
    
    if not model_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"model_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"user_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        success = cragmodel_controller.delete_crag_model(model_id, user_id)
        
        if success:
            return Response(
                {
                    "success": True,
                    "message": "Crag model deleted successfully.",
                },
                status=status.HTTP_200_OK,
            )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"validation": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except ObjectDoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Model not found.",
                "errors": {"model_id": "Invalid model ID."},
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except PermissionError as pe:
        return Response(
            {
                "success": False,
                "message": "Permission denied.",
                "errors": {"permission": str(pe)},
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while deleting crag model.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_models_by_user_id_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to get crag models by user ID.
    
    INPUT: {
        "user_id": str (required) - via query params
    }
    OUTPUT: {
        "success": bool,
        "message": str,
        "data": list of CragModel objects,
        "errors": dict  # Only if success is False
    }
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    user_id = request.query_params.get("user_id", "").strip()
    if not user_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"user_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        models_qs = cragmodel_controller.get_models_by_user_id(user_id)

        if models_qs is None:
            return Response(
                {
                    "success": False,
                    "message": "User not found.",
                    "errors": {"user_id": "Invalid user ID."},
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
                "errors": {"user_id": str(ve)},
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