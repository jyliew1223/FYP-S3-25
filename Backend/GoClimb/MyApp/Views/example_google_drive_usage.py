# Example usage of Google Drive upload functionality

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

from MyApp.Controller.cragmodel_controller import create_crag_model

@csrf_exempt
@require_http_methods(["POST"])
def create_crag_model_from_google_drive(request):
    """
    Example view to create a crag model from Google Drive URL.
    
    Expected JSON payload:
    {
        "user_id": "user123",
        "crag_id": "CRAG-000001", 
        "name": "My 3D Model",
        "description": "A climbing route model",
        "google_drive_url": "https://drive.google.com/file/d/1ABC123.../view"
    }
    """
    try:
        data = json.loads(request.body)
        
        # Extract Google Drive URL
        google_drive_url = data.pop('google_drive_url', None)
        user_id = data.pop('user_id')
        
        if not google_drive_url:
            return JsonResponse({
                'success': False,
                'error': 'google_drive_url is required'
            }, status=400)
        
        # Create the crag model with Google Drive download
        crag_model = create_crag_model(
            user_id=user_id,
            data=data,
            google_drive_url=google_drive_url
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Crag model created successfully',
            'data': {
                'model_id': crag_model.pk,
                'bucket_path': crag_model.bucket_path
            }
        })
        
    except ValueError as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }, status=500)


@csrf_exempt 
@require_http_methods(["POST"])
def create_crag_model_from_files(request):
    """
    Example view to create a crag model from uploaded files.
    
    Expected form data:
    - user_id: string
    - crag_id: string
    - name: string
    - description: string (optional)
    - model_files: multiple files
    """
    try:
        # Get form data
        user_id = request.POST.get('user_id')
        data = {
            'crag_id': request.POST.get('crag_id'),
            'name': request.POST.get('name'),
            'description': request.POST.get('description', ''),
        }
        
        # Get uploaded files
        model_files = request.FILES.getlist('model_files')
        
        if not user_id:
            return JsonResponse({
                'success': False,
                'error': 'user_id is required'
            }, status=400)
        
        # Create the crag model with uploaded files
        crag_model = create_crag_model(
            user_id=user_id,
            data=data,
            model_files=model_files if model_files else None
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Crag model created successfully',
            'data': {
                'model_id': crag_model.pk,
                'bucket_path': crag_model.bucket_path
            }
        })
        
    except ValueError as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }, status=500)