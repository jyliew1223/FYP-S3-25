from typing import Any, Optional
from MyApp.Entity.crag import Crag
from datetime import timedelta
from django.utils.timezone import now
from MyApp.Entity.climblog import ClimbLog
from django.db.models import Count
from MyApp.Utils.helper import PrefixedIDConverter
from django.core.exceptions import ObjectDoesNotExist


def create_crag(crag_data: dict) -> Crag:
    from MyApp.Serializer.serializers import CragSerializer
    
    serializer = CragSerializer(data=crag_data)
    if not serializer.is_valid():
        raise ValueError(serializer.errors)
    
    crag = serializer.save()
    return crag


def delete_crag(crag_id: str) -> bool:
    if not crag_id:
        raise ValueError("crag_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(crag_id)
    
    try:
        crag = Crag.objects.get(crag_id=raw_id)
        crag.delete()
        return True
    except Crag.DoesNotExist:
        raise ObjectDoesNotExist(f"Crag with ID {crag_id} does not exist.")


def get_crag_info(crag_id: str) -> Optional[Crag]:

    raw_id = PrefixedIDConverter.to_raw_id(crag_id)
    return Crag.objects.filter(crag_id=raw_id).first()

def get_monthly_ranking(count: int) -> list:

    if count < 1:
        raise ValueError("count must be a positive integer")

    today = now().date()
    period_start = today - timedelta(days=30)
    ranking = (
        ClimbLog.objects.filter(date_climbed__gte=period_start)
        .values("route__crag")
        .annotate(total_climbs=Count("log_id"))
        .order_by("-total_climbs")[:count]
    )

    crag_list = []
    for item in ranking:
        crag_obj = Crag.objects.filter(crag_id=item["route__crag"]).first()
        if crag_obj:
            crag_list.append(crag_obj)
    return crag_list

def get_trending_crags(count: int) -> list[dict[str, Any]]:
    if count < 1:
        raise ValueError(f"count must be a positive integer, count:{count}")

    days = 7
    today = now().date()
    period_start = today - timedelta(days=days)
    lastperiod_start = today - timedelta(days=days * 2)

    current_counts = (
        ClimbLog.objects.filter(date_climbed__gte=period_start)
        .values("route__crag")
        .annotate(current_count=Count("route__crag"))
    )

    previous_counts = (
        ClimbLog.objects.filter(
            date_climbed__gte=lastperiod_start, date_climbed__lt=period_start
        )
        .values("route__crag")
        .annotate(previous_count=Count("log_id"))
    )

    previous_lookup = {
        item["route__crag"]: item["previous_count"] for item in previous_counts
    }

    crag_ids = [item["route__crag"] for item in current_counts]
    crags = {c.crag_id: c for c in Crag.objects.filter(crag_id__in=crag_ids)}

    trending_list: list[dict[str, Any]] = []

    for current in current_counts:
        crag_id = current["route__crag"]
        crag_obj = crags.get(crag_id)
        if not crag_obj:
            continue

        current_count = current["current_count"]
        previous_count = previous_lookup.get(crag_id, 0)
        growth = current_count - previous_count
        growth_rate = (growth / previous_count) if previous_count > 0 else growth

        if growth > 0:
            trending_list.append(
                {
                    "crag": crag_obj,
                    "current_count": current_count,
                    "previous_count": previous_count,
                    "growth": growth,
                    "growth_rate": growth_rate,
                }
            )

    trending_list.sort(key=lambda x: x["growth_rate"], reverse=True)
    return trending_list[:count]


# --------------------
# CREATING_01 (start)
# --------------------

def create_crag(*, name, location_lat, location_lon, description=""):
    if not isinstance(name, str) or not name.strip():
        raise ValueError("Invalid name")

    try:
        lat = float(location_lat)
        lon = float(location_lon)
    except (TypeError, ValueError):
        raise ValueError("Invalid coordinates")

    crag = Crag.objects.create(
        name=name.strip(),
        location_lat=lat,
        location_lon=lon,
        description=description or "",
        # If your model has `location_details` and you want to accept it:
        # location_details=location_details or {},
    )
    return crag


def create_crag_with_images(*, name, location_lat, location_lon, description="", user_id, images=None):
    from MyApp.Firebase.helpers import upload_multiple_images_to_storage
    from MyApp.Entity.user import User
    from MyApp.Utils.helper import PrefixedIDConverter
    
    # Validate basic data
    if not isinstance(name, str) or not name.strip():
        raise ValueError("Invalid name")

    try:
        lat = float(location_lat)
        lon = float(location_lon)
    except (TypeError, ValueError):
        raise ValueError("Invalid coordinates")
    
    # Validate and get user
    if not user_id:
        raise ValueError("User ID is required")
    
    try:
        # Convert formatted user ID to raw ID if needed
        raw_user_id = PrefixedIDConverter.to_raw_id(user_id) if isinstance(user_id, str) and user_id.startswith('USER-') else user_id
        user = User.objects.get(user_id=raw_user_id)
    except User.DoesNotExist:
        raise ObjectDoesNotExist(f"User with ID {user_id} does not exist")

    # Create the crag first
    crag = Crag.objects.create(
        name=name.strip(),
        location_lat=lat,
        location_lon=lon,
        description=description or "",
        user=user,
    )
    
    # Upload images if provided
    if images and len(images) > 0:
        try:
            # Create folder path for this crag's images using formatted_id
            folder_path = f"crags/{crag.formatted_id}/images"
            
            print(f"Uploading {len(images)} images to folder: {folder_path}")
            
            # Upload images to Firebase Storage
            uploaded_filenames = upload_multiple_images_to_storage(
                files=images,
                folder_path=folder_path,
                user_id=user.user_id,  # Use the actual user ID
                purpose="crag_image"
            )
            
            print(f"Successfully uploaded {len(uploaded_filenames)} images: {uploaded_filenames}")
            
            # The images are now stored in Firebase Storage
            # The CragSerializer will automatically fetch them via images_download_urls property
                
        except Exception as e:
            # If image upload fails, delete the crag and raise error
            print(f"Image upload failed: {str(e)}")
            crag.delete()
            raise ValueError(f"Failed to upload images: {str(e)}")
    else:
        print("No images provided for upload")
    
    return crag

# ------------------
# CREATING_01 (end)
# ------------------
def get_random_crag(count: int = 10, blacklist: list[str] | None = None):

    if count < 0:
        raise ValueError("Count must be a positive integer.")

    if blacklist is None:
        blacklist = []

    converter = PrefixedIDConverter()
    blacklist_int: list[int] = []

    for item in blacklist:
        data: int = converter.to_raw_id(item)
        blacklist_int.append(data)

    crags = Crag.objects.exclude(crag_id__in=blacklist_int).order_by("?")[:count]
    return crags


def get_all_crag_ids():
    # Get crag objects to access properties
    crags = Crag.objects.all().order_by('crag_id')
    
    # Build response with only selected fields
    crag_list = []
    for crag in crags:
        crag_list.append({
            "crag_id": crag.formatted_id,
            "name": crag.name,
            "location_details": crag.location_details or {}
        })
    
    return crag_list


def search_crags(query: str, limit: int = 20):
    if not query or not query.strip():
        raise ValueError("Search query is required")
    
    if limit <= 0:
        raise ValueError("Limit must be a positive integer")
    
    query = query.strip()
    
    # Search by name or description (case-insensitive)
    from django.db.models import Q
    crags = Crag.objects.filter(
        Q(name__icontains=query) | Q(description__icontains=query)
    ).order_by('name')[:limit]
    
    return crags


def get_crags_by_user_id(user_id: str):
    if not user_id:
        raise ValueError("user_id is required")
    
    # Convert formatted user ID to raw ID if needed
    raw_user_id = PrefixedIDConverter.to_raw_id(user_id) if isinstance(user_id, str) and user_id.startswith('USER-') else user_id
    
    # Check if user exists
    from MyApp.Entity.user import User
    try:
        User.objects.get(user_id=raw_user_id)
    except User.DoesNotExist:
        raise ObjectDoesNotExist(f"User with ID {user_id} does not exist")
    
    # Return crags created by this user
    return Crag.objects.filter(user__user_id=raw_user_id).order_by('-crag_id')