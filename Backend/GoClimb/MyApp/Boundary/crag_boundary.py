from typing import Any
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Serializer.serializers import CragSerializer
from MyApp.Firebase.helpers import authenticate_app_check_token
from MyApp.Controller import crag_controller
from django.core.exceptions import ObjectDoesNotExist


@api_view(["GET"])
def get_crag_info_view(request: Request) -> Response:

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

        crag = crag_controller.get_crag_info(crag_id)

        if not crag:
            return Response(
                {
                    "success": False,
                    "message": "Crag not found.",
                    "errors": {"crag_id": "Invalid ID."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CragSerializer(crag)

        return Response(
            {
                "success": True,
                "message": "Crag info fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching crag info.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_crag_monthly_ranking_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    count_param = request.query_params.get("count", "").strip()

    try:
        count = int(count_param) if count_param else 0
    except ValueError:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"count": "Must be an integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        crag_list = crag_controller.get_monthly_ranking(count)

        serialized_data = []
        for idx, crag in enumerate(crag_list, 1):
            crag_data = CragSerializer(crag).data
            serialized_data.append({"crag": crag_data, "ranking": idx})

        return Response(
            {
                "success": True,
                "message": "Monthly ranking fetched successfully.",
                "data": serialized_data,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": str(ve),
                "errors": {"count": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching monthly ranking.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_trending_crags_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    count_param = request.query_params.get("count", "").strip()

    try:
        count = int(count_param) if count_param else 0
    except ValueError:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"count": "Must be an integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        trending_list = crag_controller.get_trending_crags(count)

        serialized_data = []
        for item in trending_list:
            crag_obj = item["crag"]
            crag_data = CragSerializer(crag_obj).data

            serialized_data.append(
                {
                    "crag": crag_data,
                    "current_count": item.get("current_count", 0),
                    "previous_count": item.get("previous_count", 0),
                    "growth": item.get("growth", 0),
                    "growth_rate": item.get("growth_rate", 0),
                }
            )

        return Response(
            {
                "success": True,
                "message": "Trending crags fetched successfully.",
                "data": serialized_data,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": str(ve),
                "errors": {"count": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching trending crags.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def get_random_crag_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    count = data.get("count", 10)
    blacklist = data.get("blacklist", [])

    try:
        count = int(count)
    except (ValueError, TypeError):
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"count": "Must be an integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(blacklist, list):
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"blacklist": "Must be a list."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        crag_list = crag_controller.get_random_crag(count, blacklist)

        serializer = CragSerializer(crag_list, many=True)

        return Response(
            {
                "success": True,
                "message": "Crags fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": str(ve),
                "errors": {"validation": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching crags.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_all_crag_ids_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to get all crag IDs with location details.

    INPUT: No parameters required
    OUTPUT: {
        "success": bool,
        "message": str,
        "data": [
            {
                "crag_id": str,
                "name": str,
                "location_details": dict
            }
        ]
    }
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    try:
        crag_data = crag_controller.get_all_crag_ids()

        return Response(
            {
                "success": True,
                "message": "Crag IDs fetched successfully.",
                "data": crag_data,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching crag IDs.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
def delete_crag_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to delete a crag.
    
    INPUT (JSON):
    - crag_id: string (required) - ID of the crag to delete
    
    OUTPUT: {
        "success": bool,
        "message": str,
        "errors": dict
    }
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    crag_id = request.data.get("crag_id", "").strip() if isinstance(request.data.get("crag_id"), str) else ""
    
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
        crag_controller.delete_crag(crag_id)

        return Response(
            {
                "success": True,
                "message": "Crag deleted successfully.",
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
    except ObjectDoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Crag not found.",
                "errors": {"crag_id": "Invalid ID."},
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while deleting crag.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_crags_by_user_id_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to get all crags created by a user.
    
    Query Parameters:
        user_id: string (required) - ID of the user
    
    OUTPUT: {
        "success": bool,
        "message": str,
        "data": [Crag objects],
        "errors": dict
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
        crags = crag_controller.get_crags_by_user_id(user_id)
        serializer = CragSerializer(crags, many=True)

        return Response(
            {
                "success": True,
                "message": "Crags fetched successfully.",
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
                "message": "An error occurred while fetching crags.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def create_crag_view(request):
    """
    Boundary: Handle HTTP request to create a crag with image uploads.
    
    INPUT (FormData):
    - name: string (required)
    - location_lat: number (required) 
    - location_lon: number (required)
    - description: string (optional)
    - user_id: string (required) - ID of the user creating the crag
    - images: files (optional) - Multiple image files
    
    OUTPUT: {
        "success": bool,
        "message": str,
        "data": Crag object with user info and images_urls populated,
        "errors": dict
    }
    """
    # Import here to avoid circular imports
    from MyApp.Utils.helper import extract_files_and_clean_data
    
    # 1) App Check
    auth = authenticate_app_check_token(request)
    if not auth.get("success"):
        return Response(
            {"success": False, "message": auth.get("message", "Unauthorized.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # 2) Extract images and clean form data
    images, clean_data = extract_files_and_clean_data(request, "images")
    
    # 3) Validate required fields
    required = ["name", "location_lat", "location_lon", "user_id"]
    missing = [k for k in required if k not in clean_data or clean_data.get(k) in ("", None)]

    if missing:
        return Response(
            {
                "success": False,
                "message": "Missing or invalid required fields.",
                "errors": {k: "This field is required." for k in missing},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # 4) Create crag with images
        crag_obj = crag_controller.create_crag_with_images(
            name=clean_data.get("name"),
            location_lat=clean_data.get("location_lat"),
            location_lon=clean_data.get("location_lon"),
            description=clean_data.get("description", ""),
            user_id=clean_data.get("user_id"),
            images=images
        )
        
        # 5) Serialize response
        data = CragSerializer(crag_obj).data
        
        return Response(
            {
                "success": True,
                "message": "Crag created successfully",
                "data": data,
                "errors": [],
            },
            status=status.HTTP_200_OK,
        )
        
    except ValueError as e:
        return Response(
            {"success": False, "message": str(e), "errors": {"ValueError": str(e)}},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "Failed to create crag.",
                "errors": {"Exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def search_crags_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to search crags.
    
    Query Parameters:
        query: string (required) - Search query for crag name or description
        limit: number (optional, default: 20) - Maximum results to return
    
    OUTPUT: {
        "success": bool,
        "message": str,
        "data": [Crag objects],
        "errors": dict
    }
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    query = request.query_params.get("query", "").strip()
    limit_str = request.query_params.get("limit", "20").strip()
    
    if not query:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"query": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        limit = int(limit_str) if limit_str.isdigit() else 20
        if limit <= 0:
            limit = 20
    except (ValueError, TypeError):
        limit = 20

    try:
        crags = crag_controller.search_crags(query, limit)
        serializer = CragSerializer(crags, many=True)

        return Response(
            {
                "success": True,
                "message": "Crags found successfully.",
                "data": serializer.data,
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
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while searching crags.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )