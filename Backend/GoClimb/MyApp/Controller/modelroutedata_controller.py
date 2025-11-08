from typing import Optional, Dict, Any
from django.db.models import QuerySet
from django.db import transaction

from MyApp.Entity.modelroutedata import ModelRouteData
from MyApp.Entity.cragmodel import CragModel
from MyApp.Entity.user import User
from MyApp.Utils.helper import PrefixedIDConverter
from MyApp.Serializer.serializers import ModelRouteDataSerializer


def get_by_model_id(model_id: str) -> Optional[QuerySet[ModelRouteData]]:
    """
    Controller: Get all route data for a specific model.
    
    Args:
        model_id: The model ID (can be prefixed like "MODEL-000001" or raw like "1")
    
    Returns:
        QuerySet of ModelRouteData objects or None if model not found
    
    Raises:
        ValueError: If model_id is empty or invalid
    """
    if not model_id:
        raise ValueError("model_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(model_id)

    # Check if model exists
    if not CragModel.objects.filter(model_id=raw_id).exists():
        return None

    return ModelRouteData.objects.filter(model__model_id=raw_id)


def create_model_route_data(user_id: str, data: dict) -> ModelRouteData:
    """
    Controller: Business logic to create model route data.
    
    Args:
        user_id: User ID creating the route data
        data: Dictionary containing route data (model_id, route_id, route_data, etc.)
    
    Returns:
        ModelRouteData entity
    
    Raises:
        ValueError: If data validation fails
        User.DoesNotExist: If user not found
    """
    user = User.objects.get(pk=user_id)

    # Add user_id to data for serializer
    route_data = {**data, "user_id": user_id}
    
    serializer = ModelRouteDataSerializer(data=route_data)
    if not serializer.is_valid():
        raise ValueError(serializer.errors)

    model_route_data = serializer.save()
    
    return model_route_data


def get_by_id(route_data_id: str) -> Optional[ModelRouteData]:
    """
    Controller: Get a specific model route data by ID.
    
    Args:
        route_data_id: The route data ID (can be prefixed like "ROUTE_DATA-000001" or raw like "1")
    
    Returns:
        ModelRouteData object or None if not found
    
    Raises:
        ValueError: If route_data_id is empty or invalid
    """
    if not route_data_id:
        raise ValueError("route_data_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(route_data_id)

    try:
        return ModelRouteData.objects.get(model_route_data_id=raw_id)
    except ModelRouteData.DoesNotExist:
        return None