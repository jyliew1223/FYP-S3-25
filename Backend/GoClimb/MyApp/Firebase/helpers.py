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
    
import zipfile
import io

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
            
            # Track model file counts for renaming
            model_counts = {"glb": 0, "fbx": 0}
            
            for file_path in files_to_upload:
                try:
                    # Read file content from zip
                    file_content = zip_ref.read(file_path)
                    
                    # Determine content type based on file extension
                    file_ext = file_path.lower().split('.')[-1] if '.' in file_path else 'bin'
                    content_type = get_content_type_from_extension(file_ext)
                    
                    # Determine the target file path with renaming for model files
                    if file_ext == 'glb':
                        model_counts["glb"] += 1
                        if model_counts["glb"] == 1:
                            # First .glb file becomes model.glb
                            directory = '/'.join(file_path.split('/')[:-1])
                            target_filename = "model.glb"
                            target_path = f"{directory}/{target_filename}" if directory else target_filename
                        else:
                            # Additional .glb files get numbered
                            directory = '/'.join(file_path.split('/')[:-1])
                            target_filename = f"model_{model_counts['glb']}.glb"
                            target_path = f"{directory}/{target_filename}" if directory else target_filename
                    elif file_ext == 'fbx':
                        model_counts["fbx"] += 1
                        if model_counts["fbx"] == 1:
                            # First .fbx file becomes model.fbx
                            directory = '/'.join(file_path.split('/')[:-1])
                            target_filename = "model.fbx"
                            target_path = f"{directory}/{target_filename}" if directory else target_filename
                        else:
                            # Additional .fbx files get numbered
                            directory = '/'.join(file_path.split('/')[:-1])
                            target_filename = f"model_{model_counts['fbx']}.fbx"
                            target_path = f"{directory}/{target_filename}" if directory else target_filename
                    else:
                        # Keep original path for non-model files
                        target_path = file_path
                    
                    # Create storage path
                    storage_path = f"{folder_path}/{target_path}"
                    
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
                        "renamed_filename": target_path.split('/')[-1],
                        "relative_path": target_path,
                        "original_path": file_path,
                    }
                    
                    # Upload file content
                    blob.upload_from_string(file_content, content_type=content_type)
                    uploaded_paths.append(target_path)
                    
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