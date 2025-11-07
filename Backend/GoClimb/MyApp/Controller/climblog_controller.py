from typing import List, Optional

from MyApp.Entity.climblog import ClimbLog
from MyApp.Exceptions.exceptions import InvalidUIDError

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
