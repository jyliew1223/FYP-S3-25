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


def get_models_by_user_id(user_id: str) -> Optional[QuerySet[CragModel]]:
    if not user_id:
        raise ValueError("user_id is required")

    from MyApp.Entity.user import User
    if not User.objects.filter(user_id=user_id).exists():
        return None

    return CragModel.objects.filter(user__user_id=user_id)

from typing import Dict, Any, List, Optional
from django.db import transaction
from django.core.files.uploadedfile import InMemoryUploadedFile

from MyApp.Entity.user import User
from MyApp.Serializer.serializers import CragModelSerializer
from MyApp.Firebase.helpers import upload_zipped_model_files

def create_crag_model(
    user_id: str, 
    data: dict, 
    model_files: Optional[List[InMemoryUploadedFile]] = None
):
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
            # Upload zip files (decompress and upload)
            upload_zipped_model_files(
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


def delete_crag_model(model_id: str, user_id: str) -> bool:
    if not model_id:
        raise ValueError("model_id is required")
    
    if not user_id:
        raise ValueError("user_id is required")
    
    # Handle both formatted (MODEL-000001) and raw (1) IDs
    if model_id.startswith("MODEL-"):
        raw_id = int(model_id.split("-")[1])
    else:
        try:
            raw_id = int(model_id)
        except ValueError:
            raise ValueError("Invalid model_id format")
    
    # Get the model
    crag_model = CragModel.objects.get(model_id=raw_id)
    
    # Check if user owns the model
    if crag_model.user_id != user_id:
        raise PermissionError("User does not have permission to delete this model")
    
    # Delete the model (this will also delete associated files via the model's delete method)
    with transaction.atomic():
        crag_model.delete()
    
    return True


def update_crag_model(
    model_id: str, 
    user_id: str, 
    data: dict, 
    model_files: Optional[List[InMemoryUploadedFile]] = None
) -> CragModel:
    if not model_id:
        raise ValueError("model_id is required")
    
    if not user_id:
        raise ValueError("user_id is required")
    
    # Handle both formatted (MODEL-000001) and raw (1) IDs
    if model_id.startswith("MODEL-"):
        raw_id = int(model_id.split("-")[1])
    else:
        try:
            raw_id = int(model_id)
        except ValueError:
            raise ValueError("Invalid model_id format")
    
    # Get the model
    crag_model = CragModel.objects.get(model_id=raw_id)
    
    # Check if user owns the model
    if crag_model.user_id != user_id:
        raise PermissionError("User does not have permission to update this model")
    
    # Prepare data for serializer (exclude fields that shouldn't be updated)
    update_data = {k: v for k, v in data.items() if k not in ['user_id', 'crag_id']}
    
    # Update the model using serializer
    serializer = CragModelSerializer(crag_model, data=update_data, partial=True)
    if not serializer.is_valid():
        raise ValueError(serializer.errors)
    
    with transaction.atomic():
        updated_model = serializer.save()
        
        # Upload new model files if provided
        if model_files:
            try:
                folder_path = updated_model.bucket_path
                # Upload new zip files (this will replace existing files)
                upload_zipped_model_files(
                    model_files, 
                    folder_path, 
                    user_id, 
                    "crag_model"
                )
            except ValueError as e:
                raise ValueError(f"Failed to upload model files: {str(e)}")
    
    return updated_model