from typing import Optional, List
from django.core.files.uploadedfile import InMemoryUploadedFile

from MyApp.Entity.route import Route
from MyApp.Utils.helper import PrefixedIDConverter
from MyApp.Firebase.helpers import upload_multiple_images_to_storage
from django.core.exceptions import ObjectDoesNotExist

def create_route(route_data: dict, images: Optional[List[InMemoryUploadedFile]] = None) -> Route:

    from MyApp.Serializer.serializers import RouteSerializer

    serializer = RouteSerializer(data=route_data)
    if not serializer.is_valid():
        raise ValueError(serializer.errors)

    route = serializer.save()
    
    # Upload images if provided
    if images:
        try:
            folder_path = route.images_bucket_path
            # Use the route creator's user_id for image uploads
            user_id = route.user.user_id if route.user else "system"
            upload_multiple_images_to_storage(
                images, 
                folder_path, 
                user_id, 
                "route_image"
            )
        except ValueError as e:
            # If image upload fails, delete the route and raise error
            route.delete()
            raise ValueError(f"Failed to upload images: {str(e)}")
    
    return route

def delete_route(route_id: str) -> bool:

    if not route_id:
        raise ValueError("route_id is required")

    raw_route_id = PrefixedIDConverter.to_raw_id(route_id)

    try:
        route = Route.objects.get(route_id=raw_route_id)
        route.delete()
        return True
    except ObjectDoesNotExist:
        raise ObjectDoesNotExist(f"Route with ID {route_id} does not exist.")

def get_route_by_crag_id(crag_id: str):

    if not crag_id:
        raise ValueError("crag_id is required")

    raw_crag_id = PrefixedIDConverter.to_raw_id(crag_id)
    return Route.objects.filter(crag__crag_id=raw_crag_id).all()

def get_route_by_id(route_id: str):

    if not route_id:
        raise ValueError("route_id is required")

    raw_route_id = PrefixedIDConverter.to_raw_id(route_id)
    return Route.objects.filter(pk=raw_route_id).first()
