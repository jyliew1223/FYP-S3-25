from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from MyApp.Controller import cragmodel_controller
from MyApp.Serializer.serializers import CragModelSerializer
from MyApp.Firebase.helpers import authenticate_app_check_token

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
