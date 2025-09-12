# MyApp/_TestCode/test_crag_info_view.py
import json

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch
from MyApp.Entity.crag import Crag

class CragInfoViewTests(APITestCase):
    def setUp(self):        
        self.url = reverse("crag_info")
        self.crag_id = "crag-123"
        self.empty_crag_id = "nonexistent-crag"
        self.crag = Crag.objects.create(
            crag_id=self.crag_id , 
            name="Bukit Takun",
            location_lat=3.2986,
            location_lon=101.6312,
            description="A scenic limestone hill popular for sport climbing.",
            image_urls=[
                "https://example.com/takun1.jpg",
                "https://example.com/takun2.jpg"
            ]
        )
        
    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_unouthorize(self, mock_appcheck):
        
        mock_appcheck.return_value = {"success": False}
        
        response = self.client.get(f"{self.url}?crag_id={self.crag_id}")
        response_json = response.json()
    
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))
        
    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_bad_request(self, mock_appcheck):
        
        mock_appcheck.return_value = {"success": True}
        
        response = self.client.get(f"{self.url}")
        response_json = response.json()
    
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))        
        
    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_crag_not_found(self, mock_appcheck):
        
        mock_appcheck.return_value = {"success": True}
        
        response = self.client.get(f"{self.url}?crag_id={self.empty_crag_id}")
        response_json = response.json()
    
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response_json.get("success"))
        
    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_success(self, mock_appcheck):
        
        mock_appcheck.return_value = {"success": True}
        
        response = self.client.get(f"{self.url}?crag_id={self.crag_id}")
        response_json = response.json()
    
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(response_json.get("data")["crag_id"], self.crag_id)     