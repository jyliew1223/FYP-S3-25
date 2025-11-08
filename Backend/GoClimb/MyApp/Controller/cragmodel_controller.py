from typing import Optional
from django.db.models import QuerySet

from MyApp.Entity.cragmodel import CragModel
from MyApp.Entity.crag import Crag
from MyApp.Utils.helper import PrefixedIDConverter

def get_models_by_crag_id(crag_id: str) -> Optional[QuerySet[CragModel]]:

    if not crag_id:
        raise ValueError("crag_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(crag_id)

    if not Crag.objects.filter(crag_id=raw_id).exists():
        return None

    return CragModel.objects.filter(crag__crag_id=raw_id)

from typing import Dict, Any, List, Optional
from django.db import transaction
from django.core.files.uploadedfile import InMemoryUploadedFile

from MyApp.Entity.user import User
from MyApp.Serializer.serializers import CragModelSerializer
from MyApp.Firebase.helpers import upload_multiple_images_to_storage

def create_crag_model(user_id: str, data: dict, model_files: Optional[List[InMemoryUploadedFile]] = None):
    """
    Controller: Business logic to create a crag model.
    
    Args:
        user_id: User ID creating the model
        data: Dictionary containing model data (crag_id, name, etc.)
        model_files: Optional list of model files (3D models, textures, etc.)
    
    Returns:
        CragModel entity
    
    Raises:
        ValueError: If data validation fails
        User.DoesNotExist: If user not found
    """
    user = User.objects.get(pk=user_id)

    # Add user_id to data for serializer
    model_data = {**data, "user_id": user_id}
    
    serializer = CragModelSerializer(data=model_data)
    if not serializer.is_valid():
        raise ValueError(serializer.errors)

    crag_model = serializer.save()
    
    # Upload model files if provided
    if model_files:
        try:
            folder_path = crag_model.bucket_path
            upload_multiple_images_to_storage(
                model_files, 
                folder_path, 
                user_id, 
                "crag_model"
            )
        except ValueError as e:
            # If file upload fails, delete the model and raise error
            crag_model.delete()
            raise ValueError(f"Failed to upload model files: {str(e)}")
    
    return crag_model