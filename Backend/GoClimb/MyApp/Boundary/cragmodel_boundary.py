# MyApp/Boundary/crag_model_boundary.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from MyApp.Controller import cragmodel_controller

@api_view(["GET"])
def get_models_by_crag_id_view(request):
    crag_id = request.query_params.get("crag_id", "").strip()

    if not crag_id:
        return Response(
            {"success": False, "message": "crag_id is required", "data": []},
            status=status.HTTP_400_BAD_REQUEST,
        )

    models_data = cragmodel_controller.get_models_by_crag_id(crag_id)
    if models_data is None:
        return Response(
            {"success": False, "message": f"Crag '{crag_id}' not found", "data": []},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {"success": True, "message": "Models fetched successfully", "data": models_data},
        status=status.HTTP_200_OK,
    )
