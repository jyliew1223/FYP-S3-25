from MyApp.Entity.route import Route
from MyApp.Utils.helper import PrefixedIDConverter
from django.core.exceptions import ObjectDoesNotExist

def create_route(route_data: dict) -> Route:

    from MyApp.Serializer.serializers import RouteSerializer

    serializer = RouteSerializer(data=route_data)
    if not serializer.is_valid():
        raise ValueError(serializer.errors)

    route = serializer.save()
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
