# 🧪 Django Backend Testing Coding Handbook

## Use this endpoint for the example for testing
```ini
# crag_info.py

@api_view(["GET"])
def crag_info_view(request: Request) -> Response:
    #GET /crag_info?crag_id=str
    result: dict = authenticate_app_check_token(request)
    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    crag_id = request.query_params.get("crag_id", "")
    if not crag_id:
        return Response({
            "success": False,
            "message": "Missing crag_id.",
            "errors": {"crag_id": "This field is required."}
        }, status=status.HTTP_400_BAD_REQUEST)

    crag_info = get_crag_info(crag_id)
    if not crag_info.get("success"):
        return Response(crag_info, status=status.HTTP_404_NOT_FOUND)

    crag_obj = crag_info.get("crag")
    crag_data = CragSerializer(crag_obj).data
    return Response({
        "success": True,
        "message": "Crag info fetched successfully.",
        "data": crag_data
    }, status=status.HTTP_200_OK)
```
 - First thing to do is indentify what is the possible result that this end point will return
 - for this example there will have these possible results:
    - **HTTP_401_UNAUTHORIZE**, which will returned by this endpoint when authenticate_app_check_token failed
    - **HTTP_400_BAD_REQUEST**, which will returned by this endpoint when receiving a invalid request
    - **HTTP_404_NOT_FOUND**, which will returned by this endpoint when receiving a valid request but there is no relevant data in database
    - **HTTP_200_OK**, which will returned by this endpoint when receiving a valid request and successfully fetched a valid data from database

## Setting up testing enviroment

 - The class of the testcode is a class that inherit APITestCase which integreted in Djsngo to help developers to debug and test the backend
 - The class can named to any name, but try to name it to a name that others can know which endpoint this test code is testing
    - For example i am testing for crag_info_view, then my class name will be:
```ini
# test_crag_info_view.py

class CragInfoViewTests(APITestCase):
```
 - Before starting coding test code, we will need to tell Django how to test this test code correctly inside this class by providing these datas in setUp():
    - Endpoint: the name of the endpoint that defined in url.py    
    - Datas: the needed data that will be used in the test:
        - crag_id: the crag id used to generate a Crag object in temparory database
        - empty_crag_id: the crag id used for test **HTTP_404_NOT_FOUND**
        - crag object: a crag object stored in temporary database which will be fetched during testing
        > **Django will create a temporary database when running test, but need to feed the database with some data first**
```ini
# url.py

from MyApp.Boundary.crag_info import crag_info_view

urlpatterns = [
    # Therefore the endpoint name will be 'crag_info'
    path('crag_info/', crag_info_view, name='crag_info')
]

```
```ini
# test_crag_info_view.py

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch
from MyApp.Entity.crag import Crag

class CragInfoViewTests(APITestCase):
    def setUp(self):
        # telling Django the testing endpoint
        self.url = reverse("crag_info")

        # defining the testing data
        self.crag_id = "crag-123"   # valid data
        self.empty_crag_id = "nonexistent-crag" # invalid data

        # create a object and store it into tempapory database
        # this object must be a instance of MyApp.Entity.crag.Crag Object which is also the model that the endpoint will be fetching
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
```

## Writing test code
- Django will assume every method that start with **test_** will needed to be tested, be careful when naming testing method
- the test code can be split to few part:
    - defining the mocking methods and results
        - there is few method that required when testing a endpoint which is impossible to get a valid value during testing, therefore we need to mock these method before actual testing.
        - usually the method needed to be mock will be method that related to authentication, e.g. **authenticate_app_check_token()**, **verify_id_token()**
    - start testing
    - printing result:
        - this step can skip if u sure that the returning result is correct, but printing it out will help when doing debugging
    - asserting results:
        - this step is telling Django the expected reuslt when running individual test
        - if current test is testing for failed, then tell Django this test should failed etc
    
### Mocking
- for mocking need to tell Django which method to mock using **@patch(path.method_to_mock)** before the test method
    - note that the 'path' is the path to the testing endpoint instead of the path to the method to mock
    - can thinking it is replacing the method in the targeting endpoint's files to a new method
    - u will need to define the mocking method as a input to the testing method
    - for example:
    ```ini
    # test_crag_info_view.py

    # wrong path
    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    def test_crag_info_view_unouthorize(self, mock_appcheck):
    
    # correct path
    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_unouthorize(self, mock_appcheck):

    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_unouthorize(self, mock_appcheck): #<-- define the mocking method as a input
        mock_appcheck.return_value = ["success" : true] #<-- defining the returning results

    # if have multiple @patch
    @patch("mock_a")
    @patch("mock_b")
    def test_crag_info_view_unouthorize(self, mock_a, mock_b):
        mock_a.return_value = ...
        mock_b.return_value = ...

    ```

### Start Testing
 - tell Django the testing endpoint and payloads
    ```ini
    # GET example
    response = self.client.get(f"{self.url}?crag_id={self.crag_id}")

    # POST example
    payload = {
        "crag_id": self.crag_id,
        "comment": "Amazing climbing spot!"
    }
    response = self.client.post(self.url, payload, format="json")
    ```

### Printing result
- there is no rule for printing the result, just make it clean and clear
- can use json() to make json looks clean and clear
    ```ini
    import json

    ....
        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")
    ```

### Asserting results
- Django provide multiple method for asserting result
    ```ini
        # check if a field returned true
        self.assertTrue(condition) 
        
        # check if a field returned false
        self.assertFalse(condition) 

        # check is two value equals
        self.assertEqual(value_a, value_b)
        
        # check is two value NOT equals
        self.assertNotEqual(value_a, value_b)

        # check is a key is inside a dict
        self.assertIn("name", response_json.get("data"))

        # check is a key is NOT inside a dict
        self.assertNotIn("name", response_json.get("data"))
    ```
- can check online for others

## Full Example
```ini
# MyApp/_TestCode/test_crag_info_view.py

import json

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch
from MyApp.Entity.crag import Crag

class CragInfoViewTests(APITestCase):
    # setting up
    def setUp(self):       
        # setting testing endpoint
        self.url = reverse("crag_info")

        # setting testing data
        self.crag_id = "crag-123"
        self.empty_crag_id = "nonexistent-crag"

        # setting temporary database
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
    
    # testing for HTTP_401_UNAUTHORIZED
    # telling Django what method needed to mock
    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_unouthorize(self, mock_appcheck):

        # defining the result needed to returned by mocking method
        mock_appcheck.return_value = {"success": False}
        
        # run the test
        response = self.client.get(f"{self.url}?crag_id={self.crag_id}")

        # printing results
        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")
        
        # Tell Django the expecting results
        # this test should get status code HTTP_401_UNAUTHORIZE
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # this test should get success = false
        self.assertFalse(response_json.get("success"))
    
    # testing for HTTP_400_BAD_REQUEST
    # telling Django what method needed to mock
    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_bad_request(self, mock_appcheck):
        
        # defining the result needed to returned by mocking method
        mock_appcheck.return_value = {"success": True}
        
        # run the test
        response = self.client.get(f"{self.url}")

        # printing results
        response_json = response.json()    
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")
        
        # Tell Django the expecting results
        # this test should get status code HTTP_400_BAD_REQUEST
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)        
        # this test should get success = false
        self.assertFalse(response_json.get("success"))        
        
    # testing for HTTP_404_NOT_FOUND
    # telling Django what method needed to mock
    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_crag_not_found(self, mock_appcheck):
        
        # defining the result needed to returned by mocking method
        mock_appcheck.return_value = {"success": True}
        
        # run the test
        response = self.client.get(f"{self.url}?crag_id={self.empty_crag_id}")

        # printing results
        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")
        
        # Tell Django the expecting results
        # this test should get status code HTTP_404_NOT_FOUND
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # this test should get success = false
        self.assertFalse(response_json.get("success"))
        
    # testing for HTTP_200_OK
    # telling Django what method needed to mock
    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_success(self, mock_appcheck):
        
        # defining the result needed to returned by mocking method
        mock_appcheck.return_value = {"success": True}
        
        # run the test
        response = self.client.get(f"{self.url}?crag_id={self.crag_id}")
        
        # printing results
        response_json = response.json()    
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")
        
        # Tell Django the expecting results
        # this test should get status code HTTP_200_OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # this test should get success = true
        self.assertTrue(response_json.get("success"))
        # this result should contain a crag which crag_id is same as inputed crag_id
        self.assertEqual(response_json.get("data")["crag_id"], self.crag_id)     
```