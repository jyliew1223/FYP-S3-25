import { getAuth } from '@react-native-firebase/auth';
import { RequestMethod, CustomApiRequest } from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';

export async function UploadModelRouteData(model_id, route_id, route_data) {
    try {
        const user = getAuth().currentUser;
        if (!user) {
            console.error('No authenticated user found');
            return { success: false, error: 'User not authenticated' };
        }

        const payload = {
            user_id: user.uid,
            model_id: model_id,
            route_id: route_id,
            route_data: route_data
        };

        console.log('[UploadModelRouteData] Uploading route data:', payload);

        const request = new CustomApiRequest(
            RequestMethod.POST,
            API_ENDPOINTS.BASE_URL,
            API_ENDPOINTS.MODEL_ROUTE_DATA.CREATE,
            payload,
            true
        );

        const ok = await request.sendRequest();

        if (ok) {
            const result = request.JsonObject;
            console.log('[UploadModelRouteData] Server response:', result);
            
            if (result?.success) {
                console.log('[UploadModelRouteData] Upload successful');
                return { success: true, data: result.data };
            } else {
                console.error('[UploadModelRouteData] Upload failed:', result?.message);
                return { success: false, error: result?.message || 'Upload failed' };
            }
        }

        console.error('[UploadModelRouteData] Request failed - no response received');
        console.error('[UploadModelRouteData] Request details:', {
            method: 'POST',
            endpoint: API_ENDPOINTS.MODEL_ROUTE_DATA.CREATE,
            payloadKeys: Object.keys(payload)
        });
        return { success: false, error: 'Request failed - no response received' };
    } catch (error) {
        console.error('[UploadModelRouteData] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function DeleteModelRouteData(route_data_id) {
    try {
        if (!route_data_id) {
            console.error('[DeleteModelRouteData] route data id invalid: ' + route_data_id);
            return { success: false, error: 'Invalid route data ID' };
        }

        const payload = {
            route_data_id: route_data_id
        };

        console.log('[DeleteModelRouteData] Deleting route data:', payload);

        const request = new CustomApiRequest(
            RequestMethod.DELETE,
            API_ENDPOINTS.BASE_URL,
            API_ENDPOINTS.MODEL_ROUTE_DATA.DELETE,
            payload,
            true
        );

        const ok = await request.sendRequest();

        if (ok) {
            const result = request.JsonObject;
            if (result?.success) {
                console.log('[DeleteModelRouteData] Delete successful');
                return { success: true };
            } else {
                console.error('[DeleteModelRouteData] Delete failed:', result?.message);
                return { success: false, error: result?.message || 'Delete failed' };
            }
        }

        console.error('[DeleteModelRouteData] Request failed');
        return { success: false, error: 'Request failed' };
    } catch (error) {
        console.error('[DeleteModelRouteData] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function GetRouteDatasByUserId() {
    try {
        const user = getAuth().currentUser;
        if (!user) {
            console.error('[GetRouteDatasByUserId] No authenticated user found');
            return { success: false, error: 'User not authenticated' };
        }

        const payload = {
            user_id: user.uid
        };

        console.log('[GetRouteDatasByUserId] Fetching route data for user:', user.uid);

        const request = new CustomApiRequest(
            RequestMethod.GET,
            API_ENDPOINTS.BASE_URL,
            API_ENDPOINTS.MODEL_ROUTE_DATA.GET_BY_USER_ID,
            payload,
            true
        );

        const ok = await request.sendRequest();

        if (ok) {
            const result = request.JsonObject;
            if (result?.success) {
                console.log('[GetRouteDatasByUserId] Fetch successful, count:', result.data?.length || 0);
                return { success: true, data: result.data };
            } else {
                console.error('[GetRouteDatasByUserId] Fetch failed:', result?.message);
                return { success: false, error: result?.message || 'Fetch failed' };
            }
        }

        console.error('[GetRouteDatasByUserId] Request failed');
        return { success: false, error: 'Request failed' };
    } catch (error) {
        console.error('[GetRouteDatasByUserId] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function FetchModelRouteDatasByModelId(modelId) {
      try {
        if (!modelId) {
            console.error('[FetchModelRouteDatasByModelId] modelId is null');
            return false;
        }

        const payload = {
            model_id: modelId
        };

        console.log('[FetchModelRouteDatasByModelId] Fetching route data for model: ', modelId);

        const request = new CustomApiRequest(
            RequestMethod.GET,
            API_ENDPOINTS.BASE_URL,
            API_ENDPOINTS.MODEL_ROUTE_DATA.GET_BY_MODEL_ID,
            payload,
            true
        );

        const ok = await request.sendRequest();

        if (ok) {
            const result = request.JsonObject;
            if (result?.success) {
                console.log('[FetchModelRouteDatasByModelId] Fetch successful, count:', result.data?.length || 0);
                return { success: true, data: result.data };
            } else {
                console.error('[FetchModelRouteDatasByModelId] Fetch failed:', result?.message);
                return { success: false, error: result?.message || 'Fetch failed' };
            }
        }

        console.error('[FetchModelRouteDatasByModelId] Request failed');
        return { success: false, error: 'Request failed' };
    } catch (error) {
        console.error('[FetchModelRouteDatasByModelId] Error:', error);
        return { success: false, error: error.message };
    }
}