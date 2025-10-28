# Controller/route_controller

from MyApp.Entity.route import Route
from MyApp.Serializer.serializers import RouteSerializer
from MyApp.Exceptions.exceptions import BadRequestException
from MyApp.Utils.helper import PrefixedIDConverter

from django.core.exceptions import ObjectDoesNotExist


def create_route(data):
    serializer = RouteSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return serializer.data
    else:
        raise ValueError(serializer.errors)


def delete_route(data):
    route_id = data.get("route_id", None)

    if not route_id:
        raise BadRequestException(f"route_id is required")

    try:
        raw_route_id = PrefixedIDConverter.to_raw_id(route_id)

        comment = Route.objects.get(route_id=raw_route_id)
        comment.delete()
        return True
    except ObjectDoesNotExist:
        raise Exception(f"Comment with ID {route_id} does not exist.")
    except Exception as e:
        raise Exception(f"Error deleting comment: {e}")


def get_route_by_crag_id(data):
    crag_id = data.get("crag_id", None)

    if not crag_id:
        raise BadRequestException(f"crag_id is required")

    try:
        raw_crag_id = PrefixedIDConverter.to_raw_id(crag_id)

        results = Route.objects.filter(crag__crag_id=raw_crag_id).all()

        return results

    except Exception as e:
        raise Exception(f"Error fetching comments for post {crag_id}: {e}")


def get_route_by_id(data):
    route_id = data.get("route_id", None)

    if not route_id:
        raise BadRequestException(f"route_id is required")

    try:
        raw_route_id = PrefixedIDConverter.to_raw_id(route_id)

        result = Route.objects.filter(pk=raw_route_id).first()

        return result

    except Exception as e:
        raise Exception(f"Error fetching comments for post {route_id}: {e}")
