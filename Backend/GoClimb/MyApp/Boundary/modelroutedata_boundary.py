from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from MyApp.Controller import modelroutedata_controller
from MyApp.Serializer.serializers import ModelRouteDataSerializer
from MyApp.Firebase.helpers import authenticate_app_check_token
from MyApp.Entity.user import User


@api_view(["GET"])
def get_by_model_id_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to get route data by model ID.
    
    INPUT: ?model_id=MODEL-000001
    OUTPUT: {
        "success": bool,
        "message": str,
        "data": [ModelRouteData objects],
        "errors": dict  # Only if success is False
    }
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    model_id = request.query_params.get("model_id", "").strip()
    if not model_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"model_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        route_data_qs = modelroutedata_controller.get_by_model_id(model_id)

        if route_data_qs is None:
            return Response(
                {
                    "success": False,
                    "message": "Model not found.",
                    "errors": {"model_id": "Invalid ID."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ModelRouteDataSerializer(route_data_qs, many=True)

        return Response(
            {
                "success": True,
                "message": "Route data fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"model_id": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching route data.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def create_model_route_data_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to create model route data.
    
    INPUT: {
        "user_id": str (required),
        "model_id": str (required),
        "route_id": str (required),
        "route_data": dict (required) - JSON data containing route information,
        "status": str (optional, default: "active")
    }
    OUTPUT: {
        "success": bool,
        "message": str,
        "data": ModelRouteData object,
        "errors": dict  # Only if success is False
    }
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}
    
    # Basic validation
    user_id = data.get("user_id", "")
    model_id = data.get("model_id", "")
    route_id = data.get("route_id", "")
    route_data = data.get("route_data")
    
    if not user_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"user_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not model_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"model_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not route_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"route_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not route_data:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"route_data": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        model_route_data = modelroutedata_controller.create_model_route_data(user_id, data)

        serializer = ModelRouteDataSerializer(model_route_data)

        return Response(
            {
                "success": True,
                "message": "Model route data created successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    except User.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "User not found.",
                "errors": {"user_id": "Invalid user ID."},
            },
            status=status.HTTP_404_NOT_FOUND,
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
                "message": "An error occurred while creating model route data.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )