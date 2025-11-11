from typing import Any, Dict, List
from firebase_admin import auth, exceptions, app_check, storage
from datetime import timedelta, datetime, timezone
from rest_framework.request import Request
from django.core.files.uploadedfile import InMemoryUploadedFile
import json
import uuid

def verify_id_token(id_token: str) -> dict[str, Any]:
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token.get("uid")

        return {
            "success": True,
            "message": "User verified successfully",
            "data": {
                "user_id": uid,
            },
        }
    except exceptions.FirebaseError as e:
        return {"success": False, "message": f"Firebase error: {str(e)}"}
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}

def verify_app_check_token(app_check_token) -> dict[str, Any]:

    try:
        decoded_token = app_check.verify_token(app_check_token)
        return {
            "success": True,
            "message": "App Check token verified successfully",
        }
    except exceptions.FirebaseError as e:
        return {"success": False, "message": f"Firebase error: {str(e)}"}
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}

def authenticate_app_check_token(request: Request) -> Dict[str, Any]:    
    
    return {
        "success": True,
        "message": "Request authorized",
    }

    app_check_token = request.headers.get("X-Firebase-AppCheck")

    if not app_check_token:
        return {"success": False, "message": "Missing App Check token"}

    verification_result = verify_app_check_token(app_check_token)
    if not verification_result.get("success"):
        return {"success": False, "message": verification_result.get("message")}

    return {
        "success": True,
        "message": "Request authorized",
        "data": {
            "token_info": verification_result.get("token_info"),
        },
    }

def delete_bucket_folder(bucket_folder) -> None:

    bucket = storage.bucket()

    blobs = bucket.list_blobs(prefix=bucket_folder)

    for blob in blobs:
        blob.delete()
        print(f"Deleted: {blob.name}")

    print(f"All files in folder '{bucket_folder}' have been deleted.")

def get_download_url(file_path, expires_in_hours=1) -> str:

    bucket = storage.bucket()
    blob = bucket.blob(file_path)

    if not blob.exists():
        raise FileNotFoundError(f"File '{file_path}' does not exist in the bucket.")

    url = blob.generate_signed_url(expiration=timedelta(hours=expires_in_hours))
    return url

def get_download_urls_json_in_folder(folder_path, expiry_minutes=15):

    bucket = storage.bucket()

    if not folder_path.endswith("/"):
        folder_path += "/"

    blobs = bucket.list_blobs(prefix=folder_path)

    files = []
    for blob in blobs:

        if blob.name.endswith("/"):
            continue

        url = blob.generate_signed_url(expiration=timedelta(minutes=expiry_minutes))

        files.append(
            {"name": blob.name.split("/")[-1], "path": blob.name, "download_url": url}
        )

    result = {"folder": folder_path, "files": files}

    return result

def get_download_urls_in_folder(folder_path, expiry_minutes=15) -> list:

    bucket = storage.bucket()

    if not folder_path.endswith("/"):
        folder_path += "/"

    blobs = bucket.list_blobs(prefix=folder_path)

    files = []
    for blob in blobs:

        if blob.name.endswith("/"):
            continue

        url = blob.generate_signed_url(expiration=timedelta(minutes=expiry_minutes))

        files.append(url)

    return files

def upload_image_to_storage(
    file: InMemoryUploadedFile,
    storage_path: str,
    user_id: str,
    purpose: str = "image",
) -> str:
    """
    Upload a single image file to Firebase Storage.
    
    Args:
        file: The uploaded file object
        storage_path: The full path in Firebase Storage (e.g., "users/123/images/profile.jpg")
        user_id: The user ID uploading the file
        purpose: Purpose of the upload (e.g., "profile_picture", "post_image")
    
    Returns:
        The filename that was uploaded
    
    Raises:
        ValueError: If file is invalid or upload fails
    """
    if not file:
        raise ValueError("No file provided")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise ValueError(f"Invalid file type. Allowed types: {', '.join(allowed_types)}")
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    if file.size > max_size:
        raise ValueError(f"File size exceeds maximum allowed size of {max_size / (1024 * 1024)}MB")
    
    try:
        bucket = storage.bucket()
        blob = bucket.blob(storage_path)
        
        # Set metadata
        blob.metadata = {
            "uploadedBy": str(user_id),
            "purpose": purpose,
            "upload_time": datetime.now(timezone.utc).isoformat(),
            "contentType": file.content_type,
            "original_filename": file.name,
        }
        
        # Upload file
        blob.upload_from_file(file, content_type=file.content_type)
        
        # Get just the filename from the path
        filename = storage_path.split("/")[-1]
        return filename
        
    except Exception as e:
        raise ValueError(f"Failed to upload image: {str(e)}")


def upload_multiple_images_to_storage(
    files: List[InMemoryUploadedFile],
    folder_path: str,
    user_id: str,
    purpose: str = "image",
    flatten_structure: bool = True,
) -> List[str]:
    """
    Upload multiple image files to Firebase Storage.
    
    Args:
        files: List of uploaded file objects
        folder_path: The folder path in Firebase Storage (e.g., "users/123/posts/POST-000001/images")
        user_id: The user ID uploading the files
        purpose: Purpose of the upload (e.g., "post_image", "crag_image")
        flatten_structure: If True, all files are placed directly in folder_path. 
                          If False, preserves original file paths/names when possible.
    
    Returns:
        List of relative paths of files that were uploaded (from folder_path)
    
    Raises:
        ValueError: If any file is invalid or upload fails
    """
    if not files:
        return []
    
    uploaded_paths = []
    
    for file in files:
        if flatten_structure:
            # Generate unique filename to avoid conflicts
            file_extension = file.name.split(".")[-1] if "." in file.name else "jpg"
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            relative_path = unique_filename
        else:
            # Preserve original filename, but ensure uniqueness if needed
            original_name = file.name
            # Sanitize filename for storage (remove any path separators)
            sanitized_name = original_name.replace("\\", "_").replace("/", "_")
            relative_path = sanitized_name
            
            # Check if file already exists and make unique if needed
            test_storage_path = f"{folder_path}/{relative_path}"
            bucket = storage.bucket()
            counter = 1
            while bucket.blob(test_storage_path).exists():
                name_parts = sanitized_name.rsplit(".", 1)
                if len(name_parts) == 2:
                    relative_path = f"{name_parts[0]}_{counter}.{name_parts[1]}"
                else:
                    relative_path = f"{sanitized_name}_{counter}"
                test_storage_path = f"{folder_path}/{relative_path}"
                counter += 1
        
        storage_path = f"{folder_path}/{relative_path}"
        
        try:
            upload_image_to_storage(file, storage_path, user_id, purpose)
            uploaded_paths.append(relative_path)
        except ValueError as e:
            # If any upload fails, clean up previously uploaded files
            for uploaded_path in uploaded_paths:
                try:
                    bucket = storage.bucket()
                    blob = bucket.blob(f"{folder_path}/{uploaded_path}")
                    blob.delete()
                except:
                    pass
            raise ValueError(f"Failed to upload {file.name}: {str(e)}")
    
    return uploaded_paths

def upload_file_to_storage(
    file: InMemoryUploadedFile,
    storage_path: str,
    user_id: str,
    purpose: str = "file",
    allowed_types: List[str] = None,
    max_size_mb: int = 50,
) -> str:
    """
    Upload a single file to Firebase Storage.
    
    Args:
        file: The uploaded file object
        storage_path: The full path in Firebase Storage
        user_id: The user ID uploading the file
        purpose: Purpose of the upload
        allowed_types: List of allowed MIME types (None for no restriction)
        max_size_mb: Maximum file size in MB
    
    Returns:
        The filename that was uploaded
    
    Raises:
        ValueError: If file is invalid or upload fails
    """
    if not file:
        raise ValueError("No file provided")
    
    # Validate file type if specified
    if allowed_types and file.content_type not in allowed_types:
        raise ValueError(f"Invalid file type. Allowed types: {', '.join(allowed_types)}")
    
    # Validate file size
    max_size = max_size_mb * 1024 * 1024
    if file.size > max_size:
        raise ValueError(f"File size exceeds maximum allowed size of {max_size_mb}MB")
    
    try:
        bucket = storage.bucket()
        blob = bucket.blob(storage_path)
        
        # Set metadata
        blob.metadata = {
            "uploadedBy": str(user_id),
            "purpose": purpose,
            "upload_time": datetime.now(timezone.utc).isoformat(),
            "contentType": file.content_type,
            "original_filename": file.name,
        }
        
        # Upload file
        blob.upload_from_file(file, content_type=file.content_type)
        
        # Get just the filename from the path
        filename = storage_path.split("/")[-1]
        return filename
        
    except Exception as e:
        raise ValueError(f"Failed to upload file: {str(e)}")


def upload_model_to_storage(
    files: List[InMemoryUploadedFile],
    folder_path: str,
    user_id: str,
    purpose: str = "3d_model",
) -> List[str]:
    """
    Upload multiple 3D model files to Firebase Storage with flattened structure.
    Renames .glb files to model.glb and .fbx files to model.fbx.
    
    Args:
        files: List of uploaded file objects
        folder_path: The folder path in Firebase Storage
        user_id: The user ID uploading the files
        purpose: Purpose of the upload
    
    Returns:
        List of filenames that were uploaded
    
    Raises:
        ValueError: If any file is invalid or upload fails
    """
    if not files:
        return []
    
    # Define allowed file types for 3D models and textures
    allowed_types = [
        # 3D Model formats
        "model/gltf-binary",  # .glb
        "application/octet-stream",  # .glb, .fbx (generic binary)
        # Texture formats
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
        # Other model-related formats
        "text/plain",  # .mtl files
        "application/json",  # .gltf files
    ]
    
    uploaded_filenames = []
    model_count = {"glb": 0, "fbx": 0}
    
    for file in files:
        file_extension = file.name.split(".")[-1].lower() if "." in file.name else ""
        
        # Determine the target filename
        if file_extension == "glb":
            model_count["glb"] += 1
            if model_count["glb"] == 1:
                target_filename = "model.glb"
            else:
                target_filename = f"model_{model_count['glb']}.glb"
        elif file_extension == "fbx":
            model_count["fbx"] += 1
            if model_count["fbx"] == 1:
                target_filename = "model.fbx"
            else:
                target_filename = f"model_{model_count['fbx']}.fbx"
        else:
            # For other files (textures, materials, etc.), use original name with UUID prefix to avoid conflicts
            original_name = file.name
            sanitized_name = original_name.replace("\\", "_").replace("/", "_")
            target_filename = f"{uuid.uuid4()}_{sanitized_name}"
        
        storage_path = f"{folder_path}/{target_filename}"
        
        try:
            upload_file_to_storage(
                file, 
                storage_path, 
                user_id, 
                purpose, 
                allowed_types, 
                max_size_mb=100  # Allow larger files for 3D models
            )
            uploaded_filenames.append(target_filename)
        except ValueError as e:
            # If any upload fails, clean up previously uploaded files
            for uploaded_file in uploaded_filenames:
                try:
                    bucket = storage.bucket()
                    blob = bucket.blob(f"{folder_path}/{uploaded_file}")
                    blob.delete()
                except:
                    pass
            raise ValueError(f"Failed to upload {file.name}: {str(e)}")
    
    return uploaded_filenames
    
import requests
import zipfile
import io
import os
import tempfile
from urllib.parse import urlparse, parse_qs

def extract_google_drive_file_id(url: str) -> str:
    """
    Extract file ID from various Google Drive URL formats.
    
    Args:
        url: Google Drive URL
        
    Returns:
        File ID string
        
    Raises:
        ValueError: If URL format is not recognized
    """
    # Handle different Google Drive URL formats
    if "drive.google.com" not in url:
        raise ValueError("Not a valid Google Drive URL")
    
    # Format: https://drive.google.com/file/d/FILE_ID/view
    if "/file/d/" in url:
        return url.split("/file/d/")[1].split("/")[0]
    
    # Format: https://drive.google.com/open?id=FILE_ID
    if "open?id=" in url:
        parsed = urlparse(url)
        return parse_qs(parsed.query)["id"][0]
    
    # Format: https://drive.google.com/uc?id=FILE_ID
    if "uc?id=" in url:
        parsed = urlparse(url)
        return parse_qs(parsed.query)["id"][0]
    
    # Format: https://drive.google.com/folders/FOLDER_ID
    if "/folders/" in url:
        return url.split("/folders/")[1].split("?")[0]
    
    raise ValueError("Could not extract file ID from Google Drive URL")


def download_from_google_drive(file_id: str, is_folder: bool = False) -> bytes:
    """
    Download file or folder from Google Drive.
    
    Args:
        file_id: Google Drive file/folder ID
        is_folder: True if downloading a folder (will be zipped)
        
    Returns:
        File content as bytes
        
    Raises:
        ValueError: If download fails
    """
    if is_folder:
        # For folders, Google Drive exports as zip
        url = f"https://drive.google.com/uc?export=download&id={file_id}"
    else:
        # For individual files
        url = f"https://drive.google.com/uc?export=download&id={file_id}"
    
    session = requests.Session()
    
    try:
        response = session.get(url, stream=True)
        
        # Handle Google Drive's virus scan warning for large files
        if "download_warning" in response.text:
            # Extract the confirmation token
            for line in response.text.splitlines():
                if "confirm=" in line:
                    token = line.split("confirm=")[1].split("&")[0]
                    url = f"https://drive.google.com/uc?export=download&confirm={token}&id={file_id}"
                    response = session.get(url, stream=True)
                    break
        
        if response.status_code != 200:
            raise ValueError(f"Failed to download from Google Drive: HTTP {response.status_code}")
        
        return response.content
        
    except requests.RequestException as e:
        raise ValueError(f"Network error downloading from Google Drive: {str(e)}")


def process_google_drive_files(content: bytes, original_filename: str = None) -> List[Dict[str, any]]:
    """
    Process downloaded content from Google Drive, extracting files if it's a zip.
    Preserves directory structure from zip files.
    
    Args:
        content: Downloaded file content
        original_filename: Original filename if known
        
    Returns:
        List of file dictionaries with 'name', 'content', and 'content_type'
        
    Raises:
        ValueError: If processing fails
    """
    files = []
    
    # Check if content is a zip file
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as zip_file:
            for file_info in zip_file.filelist:
                # Skip directories and hidden files
                if not file_info.is_dir() and not file_info.filename.startswith('.') and not '/.DS_Store' in file_info.filename:
                    file_content = zip_file.read(file_info.filename)
                    
                    # Determine content type based on file extension
                    file_ext = file_info.filename.lower().split('.')[-1] if '.' in file_info.filename else 'bin'
                    content_type = get_content_type_from_extension(file_ext)
                    
                    files.append({
                        'name': file_info.filename,  # Preserve full path
                        'content': file_content,
                        'content_type': content_type,
                        'size': len(file_content)
                    })
    except zipfile.BadZipFile:
        # Not a zip file, treat as single file
        if original_filename:
            file_ext = original_filename.lower().split('.')[-1] if '.' in original_filename else 'bin'
        else:
            file_ext = 'bin'
        
        content_type = get_content_type_from_extension(file_ext)
        
        files.append({
            'name': original_filename or 'downloaded_file',
            'content': content,
            'content_type': content_type,
            'size': len(content)
        })
    
    return files


def get_content_type_from_extension(extension: str) -> str:
    """
    Get MIME type from file extension.
    """
    content_types = {
        'glb': 'model/gltf-binary',
        'fbx': 'application/octet-stream',
        'gltf': 'application/json',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mtl': 'text/plain',
        'obj': 'text/plain',
        'txt': 'text/plain',
        'json': 'application/json',
    }
    return content_types.get(extension.lower(), 'application/octet-stream')


class MockUploadedFile:
    """
    Mock InMemoryUploadedFile for Google Drive downloads.
    Preserves file paths for directory structure.
    """
    def __init__(self, name: str, content: bytes, content_type: str):
        self.name = name  # This can include directory path
        self.content = content
        self.content_type = content_type
        self.size = len(content)
        self._file = io.BytesIO(content)
        # Extract just the filename for compatibility
        self.filename = name.split('/')[-1] if '/' in name else name
    
    def read(self, size=-1):
        return self._file.read(size)
    
    def seek(self, pos):
        return self._file.seek(pos)
    
    def tell(self):
        return self._file.tell()


def upload_model_from_google_drive(
    google_drive_url: str,
    folder_path: str,
    user_id: str,
    purpose: str = "3d_model",
) -> List[str]:
    """
    Download files from Google Drive and upload to Firebase Storage.
    
    Args:
        google_drive_url: Google Drive share URL
        folder_path: Target folder path in Firebase Storage
        user_id: User ID uploading the files
        purpose: Purpose of the upload
    
    Returns:
        List of filenames that were uploaded
    
    Raises:
        ValueError: If download or upload fails
    """
    try:
        # Extract file ID from URL
        file_id = extract_google_drive_file_id(google_drive_url)
        
        # Determine if it's a folder (folders typically have different URL patterns)
        is_folder = "/folders/" in google_drive_url
        
        # Download from Google Drive
        content = download_from_google_drive(file_id, is_folder)
        
        # Process the downloaded content
        files_data = process_google_drive_files(content)
        
        if not files_data:
            raise ValueError("No files found in the Google Drive download")
        
        # Upload files directly to preserve directory structure
        uploaded_paths = []
        
        for file_data in files_data:
            try:
                # Create storage path preserving directory structure
                storage_path = f"{folder_path}/{file_data['name']}"
                
                # Upload to Firebase Storage
                bucket = storage.bucket()
                blob = bucket.blob(storage_path)
                
                # Set metadata
                blob.metadata = {
                    "uploadedBy": str(user_id),
                    "purpose": purpose,
                    "upload_time": datetime.now(timezone.utc).isoformat(),
                    "contentType": file_data['content_type'],
                    "original_filename": file_data['name'].split('/')[-1],
                    "relative_path": file_data['name'],
                    "source": "google_drive"
                }
                
                # Upload file content
                blob.upload_from_string(file_data['content'], content_type=file_data['content_type'])
                uploaded_paths.append(file_data['name'])
                
            except Exception as e:
                # If any upload fails, clean up previously uploaded files
                for uploaded_path in uploaded_paths:
                    try:
                        bucket = storage.bucket()
                        blob = bucket.blob(f"{folder_path}/{uploaded_path}")
                        blob.delete()
                    except:
                        pass
                raise ValueError(f"Failed to upload {file_data['name']}: {str(e)}")
        
        return uploaded_paths
        
    except Exception as e:
        raise ValueError(f"Failed to upload from Google Drive: {str(e)}")
        
def upload_zipped_model_to_storage(
    zip_file: InMemoryUploadedFile,
    folder_path: str,
    user_id: str,
    purpose: str = "3d_model",
) -> List[str]:
    """
    Upload a zipped model folder to Firebase Storage, preserving directory structure.
    
    Args:
        zip_file: Uploaded zip file containing the model folder
        folder_path: The folder path in Firebase Storage
        user_id: The user ID uploading the files
        purpose: Purpose of the upload
    
    Returns:
        List of relative file paths that were uploaded
    
    Raises:
        ValueError: If zip file is invalid or upload fails
    """
    if not zip_file:
        raise ValueError("No zip file provided")
    
    # Validate file is a zip
    if not zip_file.name.lower().endswith('.zip'):
        raise ValueError("File must be a zip archive")
    
    # Validate file size (max 500MB for zip files)
    max_size = 500 * 1024 * 1024  # 500MB
    if zip_file.size > max_size:
        raise ValueError(f"Zip file size exceeds maximum allowed size of {max_size / (1024 * 1024)}MB")
    
    uploaded_paths = []
    
    try:
        # Extract zip file
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            # Get list of all files in zip
            file_list = zip_ref.namelist()
            
            # Filter out directories and hidden files
            files_to_upload = [
                f for f in file_list 
                if not f.endswith('/') and not f.startswith('.') and not '/.DS_Store' in f
            ]
            
            if not files_to_upload:
                raise ValueError("No valid files found in zip archive")
            
            for file_path in files_to_upload:
                try:
                    # Read file content from zip
                    file_content = zip_ref.read(file_path)
                    
                    # Determine content type based on file extension
                    file_ext = file_path.lower().split('.')[-1] if '.' in file_path else 'bin'
                    content_type = get_content_type_from_extension(file_ext)
                    
                    # Create storage path preserving directory structure
                    storage_path = f"{folder_path}/{file_path}"
                    
                    # Upload to Firebase Storage
                    bucket = storage.bucket()
                    blob = bucket.blob(storage_path)
                    
                    # Set metadata
                    blob.metadata = {
                        "uploadedBy": str(user_id),
                        "purpose": purpose,
                        "upload_time": datetime.now(timezone.utc).isoformat(),
                        "contentType": content_type,
                        "original_filename": file_path.split('/')[-1],
                        "relative_path": file_path,
                    }
                    
                    # Upload file content
                    blob.upload_from_string(file_content, content_type=content_type)
                    uploaded_paths.append(file_path)
                    
                except Exception as e:
                    # If any file upload fails, clean up previously uploaded files
                    for uploaded_path in uploaded_paths:
                        try:
                            bucket = storage.bucket()
                            blob = bucket.blob(f"{folder_path}/{uploaded_path}")
                            blob.delete()
                        except:
                            pass
                    raise ValueError(f"Failed to upload {file_path}: {str(e)}")
        
        return uploaded_paths
        
    except zipfile.BadZipFile:
        raise ValueError("Invalid zip file format")
    except Exception as e:
        # Clean up any uploaded files on error
        for uploaded_path in uploaded_paths:
            try:
                bucket = storage.bucket()
                blob = bucket.blob(f"{folder_path}/{uploaded_path}")
                blob.delete()
            except:
                pass
        raise ValueError(f"Failed to process zip file: {str(e)}")


def upload_zipped_model_files(
    zip_files: List[InMemoryUploadedFile],
    folder_path: str,
    user_id: str,
    purpose: str = "3d_model",
) -> List[str]:
    """
    Upload zipped model files to Firebase Storage, preserving directory structure.
    Frontend only sends zip files.
    
    Args:
        zip_files: List of uploaded zip files
        folder_path: The folder path in Firebase Storage
        user_id: The user ID uploading the files
        purpose: Purpose of the upload
    
    Returns:
        List of relative file paths that were uploaded
    
    Raises:
        ValueError: If zip files are invalid or upload fails
    """
    if not zip_files:
        raise ValueError("No zip files provided")
    
    all_uploaded_paths = []
    
    for zip_file in zip_files:
        # Validate it's a zip file
        if not zip_file.name.lower().endswith('.zip'):
            raise ValueError(f"File {zip_file.name} is not a zip file. Only zip files are allowed.")
        
        # Process this zip file
        uploaded_paths = upload_zipped_model_to_storage(zip_file, folder_path, user_id, purpose)
        all_uploaded_paths.extend(uploaded_paths)
    
    return all_uploaded_paths