# MyApp/Boundary/crag_model_boundary.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from MyApp.Controller import cragmodel_controller
from MyApp.Serializer.serializers import CragModelSerializer
from MyApp.Firebase.helpers import authenticate_app_check_token


@api_view(["GET"])
def get_models_by_crag_id_view(request):
    """
    Boundary: Handle HTTP request/response and serialization.
    QUERY: ?crag_id=123 or ?crag_id=CRAG-123
    OUTPUT: { "success": true, "data": [...], "message": "...", "errors": [] }
    """
    try:
        # Authentication
        auth = authenticate_app_check_token(request)
        if not auth.get("success"):
            return Response(auth, status=status.HTTP_401_UNAUTHORIZED)

        # Input validation
        crag_id = request.query_params.get("crag_id", "").strip()
        if not crag_id:
            return Response(
                {
                    "success": False,
                    "message": "Invalid input.",
                    "data": [],
                    "errors": {"crag_id": "crag_id is required"},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Call controller for business logic
        models_qs = cragmodel_controller.get_models_by_crag_id(crag_id)
        
        # Handle not found case
        if models_qs is None:
            return Response(
                {
                    "success": False,
                    "message": f"Crag '{crag_id}' not found",
                    "data": [],
                    "errors": {"crag_id": "Invalid ID."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Serialize entities (Boundary responsibility)
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
                "data": [],
                "errors": {"crag_id": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": str(e),
                "data": [],
                "errors": {"Exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
