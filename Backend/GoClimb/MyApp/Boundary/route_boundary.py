from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Firebase.helpers import authenticate_app_check_token
from MyApp.Exceptions.exceptions import BadRequestException
from MyApp.Serializer.serializers import RouteSerializer
from MyApp.Controller.route_controller import (
    create_route,
    delete_route,
    get_route_by_crag_id,
    get_route_by_id,
)

from django.core.exceptions import ObjectDoesNotExist

from MyApp.Entity.route import Route
from MyApp.Firebase.helpers import parse_prefixed_int

from typing import Optional
import json


@api_view(["POST"])
def create_route_view(request: Request) -> Response:
    app_check = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    try:
        result = create_route(data)

        return Response(
            {"success": True, "data": result}, status=status.HTTP_201_CREATED
        )
    except ValueError as ve:
        return Response(
            {"success": False, "message": str(ve)}, status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
def delete_route_view(request: Request) -> Response:
    app_check = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    try:
        result = delete_route(data)

        return Response({"success": True, "data": result}, status=status.HTTP_200_OK)

    except BadRequestException as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except ObjectDoesNotExist as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_route_by_crag_id_view(request: Request) -> Response:
    app_check = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if request.method != "GET" else request.query_params
    data = data if isinstance(data, dict) else {}

    try:
        result = get_route_by_crag_id(data)

        serializer = RouteSerializer(result, many=True)

        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    except BadRequestException as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except ObjectDoesNotExist as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_route_by_id_view(request: Request) -> Response:
    app_check = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if request.method != "GET" else request.query_params
    data = data if isinstance(data, dict) else {}

    try:
        result = get_route_by_id(data)

        serializer = RouteSerializer(result, many=False)

        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    except BadRequestException as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except ObjectDoesNotExist as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    


# -------------------
# CREATING_03 (start)
# -------------------

@api_view(["POST"])
def create_route(request):
    """
    Create a Route.

    Body expects (minimum):
      - route_name: str
      - route_grade: int
      - crag_id: int OR "CRAG-000123" (serializer handles formatted -> raw)

    Optional fields from the old diagram (length, color, type, etc.) are ignored by design
    because they're not in the current Route model.
    """
    # 1) Firebase App Check
    auth = authenticate_app_check_token(request)
    if not auth.get("success"):
        return Response(
            {"success": False, "message": auth.get("message", "Unauthorized.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # 2) Validate & create via serializer
    serializer = RouteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    route = serializer.save()

    # 3) Success payload follows your project’s shape
    return Response(
        {
            "success": True,
            "message": "Route created successfully",
            "data": RouteSerializer(route).data,  # ensures read-only fields (route_id, images_urls, crag) included
            "errors": [],
        },
        status=status.HTTP_200_OK,
    )

# -----------------
# CREATING_03 (end)
# -----------------



# -----------------
# DELETE_02 (start)
# -----------------

from typing import Optional
import json
from urllib.parse import parse_qs

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from MyApp.Entity.route import Route
from MyApp.Utils.helper import authenticate_app_check_token
from MyApp.Firebase.helpers import parse_prefixed_int


def _first_val(d, *keys):
    for k in keys:
        if k in d and d[k] is not None:
            v = d[k]
            # handle QueryDict / list values
            if isinstance(v, (list, tuple)):
                return v[0] if v else None
            return v
    return None


def _extract_id_from_request(request) -> Optional[str]:
    """
    Try very hard to get route id:
    - query params (?route_id=... or ?id=...)
    - DRF-parsed request.data (JSON/form/multipart)
    - raw JSON in request.body
    - urlencoded body (application/x-www-form-urlencoded sent w/o content_type)
    - low-level QUERY_STRING fallbacks
    Accepts both 'route_id' and 'id'.
    """
    # 1) DRF query params
    raw = _first_val(request.query_params, "route_id", "id")
    if raw:
        return raw

    # 2) DRF data (works if content_type set correctly)
    try:
        data = getattr(request, "data", None) or {}
        raw = _first_val(data, "route_id", "id")
        if raw:
            return raw
    except Exception:
        pass

    # 3) Raw body as JSON
    try:
        if request.body:
            obj = json.loads(request.body.decode("utf-8"))
            raw = _first_val(obj, "route_id", "id")
            if raw:
                return raw
    except Exception:
        pass

    # 4) Raw body as urlencoded (e.g., b"route_id=ROUTE-000003")
    try:
        if request.body:
            qs = parse_qs(request.body.decode("utf-8"), keep_blank_values=True)
            # parse_qs returns dict[str, list[str]]
            raw = _first_val({k: v for k, v in qs.items()}, "route_id", "id")
            if raw:
                return raw
    except Exception:
        pass

    # 5) Low-level QUERY_STRING (just in case)
    try:
        qs = parse_qs(request.META.get("QUERY_STRING", ""), keep_blank_values=True)
        raw = _first_val({k: v for k, v in qs.items()}, "route_id", "id")
        if raw:
            return raw
    except Exception:
        pass

    return None


@api_view(["DELETE"])
def delete_route_view(request):
    # Auth (App Check)
    auth = authenticate_app_check_token(request)
    if not auth.get("success"):
        return Response(
            {"success": False, "message": auth.get("message", "Unauthorized.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    
    raw = _extract_id_from_request(request)
    if raw is None:
        errors = {"route_id": "This field is required."}
        return Response(
            {"success": False, "message": "Missing required fields.", "errors": errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    

    route_pk = parse_prefixed_int(raw, "ROUTE")
    if route_pk is None:
        # Bad format still counted as “not found” in your test expectations?
        # Your tests expect 404 for a well-formed-but-missing route.
        # If the format is wrong, keep 400. If format is OK but object missing, return 404.
        return Response(
            {
                "success": False,
                "message": "Invalid route_id format.",
                "errors": {"route_id": "Must be an integer or 'ROUTE-<int>'."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Look up & delete
    try:
        route = Route.objects.get(pk=route_pk)
    except Route.DoesNotExist:
        return Response(
            {"success": False, "message": "Route not found.", "errors": []},
            status=status.HTTP_404_NOT_FOUND,
        )

    route.delete()
    return Response(
        {"success": True, "message": "Route deleted successfully", "errors": []},
        status=status.HTTP_200_OK,
    )
    

# ---------------
# DELETE_02 (end)
# ---------------