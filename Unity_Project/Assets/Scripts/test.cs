using UnityEngine;
using Firebase;
using Firebase.AppCheck;
using System.Threading.Tasks;
using System.Text;
using UnityEngine.Networking;
using System.Collections;

public class TestAppCheck : MonoBehaviour
{
    void Start()
    {

#if UNITY_EDITOR
        DebugAppCheckProviderFactory.Instance.SetDebugToken("523DF6DB-B8A0-453A-A9E1-2F2406A41090");
        FirebaseAppCheck.SetAppCheckProviderFactory(DebugAppCheckProviderFactory.Instance);
#elif UNITY_ANDROID && !UNITY_EDITOR
        FirebaseAppCheck.SetAppCheckProviderFactory(
            PlayIntegrityProviderFactory.Instance);
#elif UNITY_IOS && !UNITY_EDITOR
        FirebaseAppCheck.SetAppCheckProviderFactory(
            AppAttestProviderFactory.Instance);
#else
        Debug.Log("App Check not initialized in editor or unsupported platform");
#endif

        GetAppCheckToken();
    }

    async void GetAppCheckToken()
    {
        try
        {
            AppCheckToken token = await FirebaseAppCheck.DefaultInstance.GetAppCheckTokenAsync(false);

            if (!string.IsNullOrEmpty(token.Token))
            {
                Debug.Log("App Check Token: " + token.Token);
                StartCoroutine(SendTokenToBackend(token.Token));
            }
            else
            {
                Debug.LogError("App Check Token is empty");
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError("Failed to get App Check token: " + e.Message);
        }
    }
    IEnumerator SendTokenToBackend(string appCheckToken)
    {
        string url = "http://127.0.0.1:8000/verify_app_check_token/"; // your Django endpoint

        UnityWebRequest request = new UnityWebRequest(url, "POST");
        byte[] bodyRaw = Encoding.UTF8.GetBytes("{}"); // empty JSON body
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");

        // Send App Check token in header
        request.SetRequestHeader("X-Firebase-AppCheck", appCheckToken);

        yield return request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
            Debug.LogError("Request failed: " + request.error);
        else
            Debug.Log("Backend response: " + request.downloadHandler.text);
    }

}