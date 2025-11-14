import json
import requests
from django.conf import settings
from django.db import models
from typing import Tuple, Dict, Any
from MyApp.Firebase.helpers import (
    delete_bucket_folder,
    get_download_urls_in_folder,
)

class Crag(models.Model):
    class Meta:
        db_table = "crag"
        managed = True

    crag_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    location_lat = models.FloatField()
    location_lon = models.FloatField()
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='crags', null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.name} | {self.crag_id}"

    def delete(self, *args, **kwargs) -> Tuple[int, Dict[Any, int]]:

        folder_path = self.bucket_path
        if folder_path:
            try:
                delete_bucket_folder(folder_path)
            except Exception as e:
                print(f"Warning: could not delete bucket folder '{folder_path}': {e}")

        return super().delete(*args, **kwargs)

    @property
    def location_details(self):

        if not self.location_lat or not self.location_lon:
            return json.dumps({})

        try:
            api_key = settings.GOOGLE_MAPS_API_KEY
            url = (
                f"https://maps.googleapis.com/maps/api/geocode/json"
                f"?latlng={self.location_lat},{self.location_lon}&key={api_key}"
            )
            response = requests.get(url)
            data = response.json()
            if data.get("status") == "OK":
                components = data["results"][0]["address_components"]
                city = country = None
                for comp in components:
                    if "locality" in comp["types"]:
                        city = comp["long_name"]
                    if "country" in comp["types"]:
                        country = comp["long_name"]

                return {"city": city, "country": country}
        except Exception as e:
            print(f"Warning: could not fetch location details: {e}")
        return {"city": None, "country": None}

    @property
    def formatted_id(self) -> str:

        return f"CRAG-{self.crag_id:06d}"

    @property
    def bucket_path(self):

        return f"crags/{self.formatted_id}"

    @property
    def images_bucket_path(self):

        if not self.bucket_path:
            return None
        return f"{self.bucket_path}/images"

    @property
    def images_download_urls(self):

        if not self.images_bucket_path:
            return None
        try:
            return get_download_urls_in_folder(self.images_bucket_path)
        except Exception as e:
            print(
                f"Warning: could not get download URLs for '{self.images_bucket_path}': {e}"
            )
            return None
