from typing import List, Optional

from django.core.exceptions import ObjectDoesNotExist

from MyApp.Entity.climblog import ClimbLog
from MyApp.Exceptions.exceptions import InvalidUIDError
from MyApp.Serializer.serializers import ClimbLogSerializer
from MyApp.Utils.helper import PrefixedIDConverter

def get_user_climb_logs(user_id: str) -> List[ClimbLog]:

    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")

    logs = ClimbLog.objects.filter(user=user_id).order_by("-date_climbed")
    return list(logs)

def get_user_climb_state(user_id: str) -> int:

    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")

    total_routes = ClimbLog.objects.filter(user=user_id).count()
    return total_routes


def create_climb_log(climb_data: dict) -> ClimbLog:
    serializer = ClimbLogSerializer(data=climb_data)
    if not serializer.is_valid():
        raise ValueError(serializer.errors)
    
    climb_log = serializer.save()
    return climb_log


def delete_climb_log(log_id: str) -> bool:
    if not log_id:
        raise ValueError("log_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(log_id)
    
    try:
        climb_log = ClimbLog.objects.get(log_id=raw_id)
        climb_log.delete()
        return True
    except ClimbLog.DoesNotExist:
        raise ObjectDoesNotExist(f"Climb log with ID {log_id} does not exist.")
