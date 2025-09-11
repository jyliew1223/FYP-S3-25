using Firebase.AppCheck;
using Firebase.Auth;
using Newtonsoft.Json.Linq;
using System.IO;
using System;
using System.Threading.Tasks;
using UnityEngine;
using Newtonsoft.Json;
using UnityEngine.Networking;
using Firebase;
using System.Text;

public static class FirebaseHelper
{
    private static FirebaseAuth auth;
    public const float AuthenticationCooldown = 500f; // milliseconds

    public static FirebaseAuth Auth
    {
        get
        {
            if (auth == null)
            {
                Debug.LogError($"{nameof(FirebaseHelper)}: Firebase Auth is not initialized. Call InitFirebaseAuth() first.");
            }
            return auth;
        }
        set => auth = value;
    }

    // ==============================================================
    // Initialize Firebase Auth
    // ==============================================================
    public static async Task<bool> InitFirebaseAuth()
    {
        Debug.Log($"{nameof(FirebaseHelper)}: Initializing Firebase...");

        var dependencyStatus = await Firebase.FirebaseApp.CheckAndFixDependenciesAsync();
        if (dependencyStatus == Firebase.DependencyStatus.Available)
        {
            Auth = FirebaseAuth.DefaultInstance;
            Debug.Log($"{nameof(FirebaseHelper)}: Firebase initialized successfully.");

            return true;
        }
        else
        {
            Debug.LogError($"{nameof(FirebaseHelper)}: Could not resolve all Firebase dependencies: {dependencyStatus}");
        }

        if (Auth == null)
        {
            Debug.LogError($"{nameof(FirebaseHelper)}: Firebase Auth is not initialized after InitFirebaseAuth().");
            return false;
        }

        return false;
    }

    // ==============================================================
    // Initialize Firebase App Check
    // ==============================================================
    public static async Task<bool> InitFirebaseAppCheck()
    {
        Debug.Log($"{nameof(FirebaseHelper)}: Initializing Firebase App Check...");
        try
        {
#if UNITY_EDITOR
            string path = Path.Combine(Application.streamingAssetsPath, "secrets.json");

            if (!File.Exists(path))
            {
                Debug.LogError($"{nameof(FirebaseHelper)}: secrets.json not found at {path}");
                return false;
            }

            string json = await File.ReadAllTextAsync(path);
            JObject secrets = JObject.Parse(json);

            string debugToken = secrets["debug_token"]?.ToString();
            if (string.IsNullOrEmpty(debugToken))
            {
                Debug.LogError($"{nameof(FirebaseHelper)}: Debug token not found in secrets.json");
                return false;
            }

            DebugAppCheckProviderFactory.Instance.SetDebugToken(debugToken);
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
            Debug.Log($"{nameof(FirebaseHelper)}: Firebase App Check initialized successfully.");

        }
        catch (Exception e)
        {
            Debug.LogError($"{nameof(FirebaseHelper)}: Failed to initialize Firebase App Check: {e.Message}");
            return false;
        }

        if (FirebaseAppCheck.DefaultInstance == null)
        {
            Debug.LogError($"{nameof(FirebaseHelper)}: Firebase App Check is not initialized.");
            return false;
        }

        return true;
    }

    // ==============================================================
    // Sign in to Firebase
    // ==============================================================
    public static async Task<bool> SignInFirebase()
    {
        if (Auth == null) return false;

        Debug.Log($"{nameof(FirebaseHelper)}: Signing in...");
        
        if (Auth.CurrentUser == null)
        {
            Debug.Log($"{nameof(FirebaseHelper)}: Previous session not found");
        }
        else
        {
            Debug.Log($"{nameof(FirebaseHelper)}: Previous session found");
        }

        if (Auth.CurrentUser == null)
        {
            // ==============================================================
            // End user session if no user is signed in
            // ==============================================================
            Debug.Log($"{nameof(FirebaseHelper)}: No user is signed in.");

            return true;
            // ==============================================================
        }

        Debug.Log($"{nameof(FirebaseHelper)}: User is signed in.");

        // ==============================================================
        // Generate ID_Token for the current user if user found
        // ==============================================================

        try
        {
            string token = await Auth.CurrentUser.TokenAsync(true);
            UserGlobalData.IDToken = token;
        }
        catch (Exception e)
        {
            Debug.LogError("Failed to get ID Token: " + e);
            return true;
        }

        Debug.Log($"{nameof(FirebaseHelper)}: ID Token: {UserGlobalData.IDToken}");
        // ==============================================================

        // small delay before verifying the ID Token to prevent Firebase timing errors
        await Task.Delay((int)(AuthenticationCooldown));

        // ==============================================================
        // Verify the ID Token
        // ==============================================================

        bool verifyIdTokenTaskResult = await VerifyIdToken(UserGlobalData.IDToken);

        if (!verifyIdTokenTaskResult)
        {
            Debug.LogWarning($"{nameof(FirebaseHelper)}: Failed to verify Token, Signing user out...");
            UserGlobalData.IDToken = null;
            Auth.SignOut();
            return true;
        }

        ToastController.Instance.ShowToast($"Welcome Back {Auth.CurrentUser.DisplayName}");

        return true;
    }


    [System.Serializable]
    public class VerifyIdTokenPayload
    {
        public string id_token;
    }
    private record VerifyIdTokenResponse
    {
        public bool success;
        public string message;
        public string errors;
    }
    public static async Task<bool> VerifyIdToken(string idToken, int retryCount = 0)
    {
        if(Auth == null) return false;

        if (retryCount > 10)
        {
            Debug.LogError($"{nameof(FirebaseHelper)}: Token verification failed after retry.");
            return false;
        }

        if (retryCount == 0)
        {
            Debug.Log($"{nameof(FirebaseHelper)}: Verifying Token...");
        }

        string path = "verify_id_token/";
        string url = GlobalSetting.BaseUrl + path;

        // Create the JSON body
        var payload = new VerifyIdTokenPayload { id_token = idToken };
        string jsonBody = JsonUtility.ToJson(payload);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);

        // Create a POST request
        using UnityWebRequest request = new(url, "POST");
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");

        AppCheckToken appCheckToken = await FirebaseAppCheck.DefaultInstance.GetAppCheckTokenAsync(false);
        request.SetRequestHeader("X-Firebase-AppCheck", appCheckToken.Token);

        try
        {
            await request.SendWebRequest();

            VerifyIdTokenResponse response = JsonUtility.FromJson<VerifyIdTokenResponse>(request.downloadHandler.text);

            if (request.result != UnityWebRequest.Result.Success)
            {
                if (!string.IsNullOrEmpty(response.errors))
                {
                    try
                    {
                        JObject parsedErrors = JObject.Parse(response.errors);
                        string formattedErrors = parsedErrors.ToString(Formatting.Indented);
                        Debug.LogError($"{nameof(FirebaseHelper)}: Verify request failed: {request.error}:\n{formattedErrors}");
                    }
                    catch (JsonReaderException e)
                    {
                        Debug.LogError($"{nameof(FirebaseHelper)}: Failed to parse error JSON: {e.Message}\nRaw error string: {response.errors}");
                    }
                }
                else
                {
                    Debug.LogError($"{nameof(FirebaseHelper)}: Verify request failed: {request.error}: {response.message ?? "No message..."}");
                }

                return false;
            }

            if (response.success)
            {
                Debug.Log($"{nameof(FirebaseHelper)}: Token Verified");
                return true;
            }
            else if (response.message.Contains("expired"))
            {
                Debug.Log($"{nameof(FirebaseHelper)}: Token expired. Refreshing...");

                UserGlobalData.IDToken = await Auth.CurrentUser.TokenAsync(true);

                return await VerifyIdToken(UserGlobalData.IDToken, retryCount + 1);
            }
            else
            {
                Debug.LogError($"{nameof(FirebaseHelper)}: Failed to verify:" + response.message);
                return false;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"{nameof(FirebaseHelper)}: Exception during HTTP request: {e}");
            return false;
        }
    }


    public static async Task SignInFirebaseWithEmailAndPassword(string email, string password)
    {
        if (Auth == null) return;

        Debug.Log($"{nameof(FirebaseHelper)}: Signing in with email and password...");

        try
        {
            AuthResult result = await Auth.SignInWithEmailAndPasswordAsync(email, password);
            FirebaseUser newUser = result.User;
            if (newUser == null)
            {
                Debug.LogError($"{nameof(FirebaseHelper)}: SignInWithEmailAndPasswordAsync completed but returned null user.");
                return;
            }
            Debug.Log($"{nameof(FirebaseHelper)}: User signed in successfully: {newUser.DisplayName ?? newUser.Email}");
        }
        catch (FirebaseException e)
        {
            var errorCode = (AuthError)e.ErrorCode;

            switch (errorCode)
            {
                case AuthError.InvalidEmail:
                case AuthError.WrongPassword:
                case AuthError.UserNotFound:
                    Debug.LogError($"{nameof(FirebaseHelper)}: Invalid credentials provided.");
                    return;

                case AuthError.NetworkRequestFailed:
                    Debug.LogError($"{nameof(FirebaseHelper)}: Network error. Please check your connection.");
                    return;

                default:
                    Debug.LogError($"{nameof(FirebaseHelper)}: Firebase sign-in error: {e.Message}");
                    return;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"{nameof(FirebaseHelper)}: Unexpected error during sign-in: {e}");
            return;
        }
    }

    // ==============================================================
    // Obtain App Check Token for testing
    // ==============================================================
    private record VerifyAppCheckTokenResponse
    {
        public bool success;
        public string message;
        public string errors;
    }
    public static async Task<bool> VerifyAppCheckToken()
    {

        Debug.Log($"{nameof(FirebaseHelper)}: Obtaining App Check token...");

        AppCheckToken token = await FirebaseAppCheck.DefaultInstance.GetAppCheckTokenAsync(false);

        string path = "verify_app_check_token/";
        using UnityWebRequest request = new(GlobalSetting.BaseUrl + path, "GET");

        request.downloadHandler = new DownloadHandlerBuffer();

        request.SetRequestHeader("Content-Type", "application/json");
        request.SetRequestHeader("X-Firebase-AppCheck", token.Token);

        try
        {
            var operation = request.SendWebRequest();
            while (!operation.isDone) await Task.Yield();

            VerifyAppCheckTokenResponse response = JsonUtility.FromJson<VerifyAppCheckTokenResponse>(request.downloadHandler.text);

            if (request.result != UnityWebRequest.Result.Success)
            {
                if (!string.IsNullOrEmpty(response.errors))
                {
                    try
                    {
                        JObject parsedErrors = JObject.Parse(response.errors);
                        string formattedErrors = parsedErrors.ToString(Formatting.Indented);
                        Debug.LogError($"{nameof(FirebaseHelper)}: Verify request failed: {request.error}:\n{formattedErrors}");
                    }
                    catch (JsonReaderException e)
                    {
                        Debug.LogError($"{nameof(FirebaseHelper)}: Failed to parse error JSON: {e.Message}\nRaw error string: {response.errors}");
                    }
                }
                else
                {
                    Debug.LogError($"{nameof(FirebaseHelper)}: Verify request failed: {request.error}: {response.message ?? "No message..."}");
                }
                return false;
            }

            if (response.success)
            {
                Debug.Log($"{nameof(FirebaseHelper)}: App Check Token Verified");
                return true;
            }
            else
            {
                Debug.LogError($"{nameof(FirebaseHelper)}: Failed to verify App Check Token: {response.message}");
                return false;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"{nameof(FirebaseHelper)}: Exception during HTTP request: {e}");
            return false;
        }
    }
}