import { RequestMethod, CustomApiRequest } from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';
import { getAuth } from '@react-native-firebase/auth';

export async function UploadModel(crag_id, modelData = {}, uploadSource = null) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return {
      success: false,
      message: 'Authentication required',
      errors: { auth: 'User not logged in' },
      data: null
    };
  }

  try {
    const user_id = user.uid;
    let requestPayload;

    if (modelData.uploadType === 'zip_file' && uploadSource) {
      const formData = new FormData();
      formData.append('user_id', user_id);
      formData.append('crag_id', crag_id);
      formData.append('name', modelData.name || 'Untitled Model');
      formData.append('status', modelData.status || 'active');
      formData.append('model_files', {
        uri: uploadSource.uri,
        type: uploadSource.type || 'application/zip',
        name: uploadSource.name,
      });
      requestPayload = formData;
    } else {
      requestPayload = {
        user_id,
        crag_id,
        name: modelData.name || 'Untitled Model',
        status: modelData.status || 'active',
        folder_path: uploadSource,
        ...modelData
      };
    }

    const formData = new FormData();
    formData.append('user_id', user_id);
    formData.append('crag_id', crag_id);
    formData.append('name', modelData.name || 'Untitled Model');
    formData.append('status', modelData.status || 'active');
    formData.append('model_files', {
      uri: uploadSource.uri,
      type: uploadSource.type || 'application/zip',
      name: uploadSource.name,
    });
    requestPayload = formData;

    const req = new CustomApiRequest(
      RequestMethod.POST,
      API_ENDPOINTS.BASE_URL,
      API_ENDPOINTS.CRAG_MODEL.UPLOAD,
      requestPayload,
      true
    );

    await req.sendRequest();
    const jsonObject = req.JsonObject;

    if (!jsonObject?.success) {
      return {
        success: false,
        message: jsonObject?.message || 'Failed to upload model',
        errors: jsonObject?.errors || {},
        data: null
      };
    }

    return {
      success: true,
      message: jsonObject.message || 'Model uploaded successfully',
      data: jsonObject.data,
      errors: null
    };

  } catch (error) {
    return {
      success: false,
      message: 'An error occurred while uploading model',
      errors: { exception: error.message },
      data: null
    };
  }
}

export async function fetchCragByUserId() {
const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return {
      success: false,
      message: 'Authentication required',
      errors: { auth: 'User not logged in' },
      data: null
    };
  }

    const user_id = user.uid;

  const payload = {
    user_id: user_id
  }

  const request = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CRAG_MODEL.GET_BY_USER_ID,
    payload,
    true
  )

  await request.sendRequest()

  const response = request.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed',
      errors: response?.errors || {},
      data: null
    };
  }

  return {
    success: true,
    message: response.message || 'Success',
    data: response.data,
    errors: null
  };
}

export async function updateModel(modelId, updateData) {
  if (!modelId) {
    return {
      success: false,
      message: 'Model ID is required',
      errors: { modelId: 'Invalid model ID' },
      data: null
    };
  }

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return {
      success: false,
      message: 'Authentication required',
      errors: { auth: 'User not logged in' },
      data: null
    };
  }

  try {
    const payload = {
      user_id: user.uid,
      model_id: modelId,
      ...updateData
    };

    const request = new CustomApiRequest(
      RequestMethod.PUT,
      API_ENDPOINTS.BASE_URL,
      API_ENDPOINTS.CRAG_MODEL.UPDATE,
      payload,
      true
    );

    await request.sendRequest();

    const response = request.JsonObject;

    if (!response?.success) {
      return {
        success: false,
        message: response?.message || 'Failed to update model',
        errors: response?.errors || {},
        data: null
      };
    }

    return {
      success: true,
      message: response.message || 'Model updated successfully',
      data: response.data,
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred while updating model',
      errors: { exception: error.message },
      data: null
    };
  }
}

export async function deleteModel(modelId){
  if (!modelId) {
    return {
      success: false,
      message: 'Model ID is required',
      errors: { modelId: 'Invalid model ID' },
      data: null
    };
  }

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return {
      success: false,
      message: 'Authentication required',
      errors: { auth: 'User not logged in' },
      data: null
    };
  }

  try {
    const payload = {
      user_id: user.uid,
      model_id: modelId
    }

    const request = new CustomApiRequest(
      RequestMethod.DELETE,
      API_ENDPOINTS.BASE_URL,
      API_ENDPOINTS.CRAG_MODEL.DELETE,
      payload,
      true
    )

    await request.sendRequest()

    const response = request.JsonObject;

    if (!response?.success) {
      return {
        success: false,
        message: response?.message || 'Failed to delete model',
        errors: response?.errors || {},
        data: null
      };
    }

    return {
      success: true,
      message: response.message || 'Model deleted successfully',
      data: response.data,
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred while deleting model',
      errors: { exception: error.message },
      data: null
    };
  }
}