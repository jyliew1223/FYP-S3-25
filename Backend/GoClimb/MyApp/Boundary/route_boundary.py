from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Firebase.helpers import authenticate_app_check_token
from MyApp.Serializer.serializers import RouteSerializer
from MyApp.Controller import route_controller

from django.core.exceptions import ObjectDoesNotExist

@api_view(["POST"])
def create_route_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    try:

        route = route_controller.create_route(data)

        serializer = RouteSerializer(route)

        return Response(
            {
                "success": True,
                "message": "Route created successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
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
                "message": "An error occurred while creating route.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["DELETE"])
def delete_route_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    route_id = request.data.get("route_id", "").strip() if isinstance(request.data.get("route_id"), str) else ""

    if not route_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"route_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        route_controller.delete_route(route_id)

        return Response(
            {
                "success": True,
                "message": "Route deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"route_id": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except ObjectDoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Route not found.",
                "errors": {"route_id": "Invalid ID."},
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while deleting route.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def get_route_by_crag_id_view(request: Request) -> Response:

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

        routes = route_controller.get_route_by_crag_id(crag_id)

        serializer = RouteSerializer(routes, many=True)

        return Response(
            {
                "success": True,
                "message": "Routes fetched successfully.",
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
                "message": "An error occurred while fetching routes.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def get_route_by_id_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    route_id = request.query_params.get("route_id", "").strip()

    if not route_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"route_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        route = route_controller.get_route_by_id(route_id)

        if not route:
            return Response(
                {
                    "success": False,
                    "message": "Route not found.",
                    "errors": {"route_id": "Invalid ID."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = RouteSerializer(route)

        return Response(
            {
                "success": True,
                "message": "Route fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"route_id": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching route.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
