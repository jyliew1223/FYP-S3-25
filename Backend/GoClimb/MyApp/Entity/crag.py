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
            return {"city": None, "country": None, "state": None, "district": None, "postal_code": None}

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
                
                # Initialize all location fields
                location_info = {
                    "city": None,
                    "country": None,
                    "state": None,
                    "district": None,
                    "postal_code": None,
                    "formatted_address": data["results"][0].get("formatted_address", "")
                }
                
                # Extract detailed location information
                for comp in components:
                    types = comp["types"]
                    long_name = comp["long_name"]
                    
                    # Country
                    if "country" in types:
                        location_info["country"] = long_name
                    
                    # State/Province/Administrative Area Level 1
                    elif "administrative_area_level_1" in types:
                        location_info["state"] = long_name
                    
                    # City/Locality or Administrative Area Level 2 (for places like Singapore)
                    elif "locality" in types:
                        location_info["city"] = long_name
                    elif "administrative_area_level_2" in types and not location_info["city"]:
                        location_info["city"] = long_name
                    
                    # District/Sublocality (neighborhoods, districts)
                    elif "sublocality" in types or "sublocality_level_1" in types:
                        location_info["district"] = long_name
                    elif "administrative_area_level_3" in types and not location_info["district"]:
                        location_info["district"] = long_name
                    
                    # Postal Code
                    elif "postal_code" in types:
                        location_info["postal_code"] = long_name
                
                # Special handling for Singapore - use more specific areas
                if location_info["country"] == "Singapore":
                    # For Singapore, if we don't have a district, try to get it from other components
                    if not location_info["district"]:
                        for comp in components:
                            types = comp["types"]
                            if "neighborhood" in types or "sublocality_level_2" in types:
                                location_info["district"] = comp["long_name"]
                                break
                    
                    # Set city to Singapore if not already set
                    if not location_info["city"]:
                        location_info["city"] = "Singapore"

                return location_info
                
        except Exception as e:
            print(f"Warning: could not fetch location details: {e}")
        
        return {"city": None, "country": None, "state": None, "district": None, "postal_code": None}

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
