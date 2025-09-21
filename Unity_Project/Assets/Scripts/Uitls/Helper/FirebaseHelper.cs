using Firebase;
using Firebase.AppCheck;
using Firebase.Auth;
using Firebase.Extensions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.InputSystem.LowLevel;
using UnityEngine.Networking;

public static class FirebaseHelper
{
    private static FirebaseAuth auth;
    private static FirebaseApp app;
    public const float AuthenticationCooldown = 500f; // milliseconds

    public static FirebaseAuth Auth
    {
        get
        {
            if (auth == null)
            {
                Debug.LogError(
                    $"{nameof(FirebaseHelper)}: Firebase Auth is not initialized. Call InitFirebaseAuth() first."
                );
            }
            return auth;
        }
        set => auth = value;
    }

    public static async Task<Firebase.FirebaseApp> GetAppAsync()
    {
        if (app != null)
            return app;

        var dependencyStatus = await Firebase.FirebaseApp.CheckAndFixDependenciesAsync();
        if (dependencyStatus == Firebase.DependencyStatus.Available)
        {
            app = Firebase.FirebaseApp.DefaultInstance;
            return app;
        }
        else
        {
            Debug.LogError(
                $"{nameof(FirebaseHelper)}: Firebase dependencies not available: {dependencyStatus}"
            );
            return null;
        }
    }

    public static async Task<bool> InitFirebaseWithAppCheck()
    {
        var dependencyStatus = await FirebaseApp.CheckAndFixDependenciesAsync();
        if (dependencyStatus != DependencyStatus.Available)
        {
            Debug.LogError(
                $"{nameof(FirebaseHelper)}: Could not resolve Firebase dependencies: {dependencyStatus}"
            );
            return false;
        }

#if UNITY_EDITOR
        Debug.Log($"{nameof(FirebaseHelper)}: Firebase App Check initializing in Editor.");
        string path = Path.Combine(Application.streamingAssetsPath, "secrets.json");
        if (File.Exists(path))
        {
            string json = await File.ReadAllTextAsync(path);
            JObject secrets = JObject.Parse(json);
            string debugToken = secrets["debug_token"]?.ToString();
            if (!string.IsNullOrEmpty(debugToken))
            {
                DebugAppCheckProviderFactory.Instance.SetDebugToken(debugToken);
                FirebaseAppCheck.SetAppCheckProviderFactory(DebugAppCheckProviderFactory.Instance);
            }
        }
#endif

#if UNITY_ANDROID && !UNITY_EDITOR

#if DEVELOPMENT_BUILD
        Debug.Log(
            $"{nameof(FirebaseHelper)}: Firebase App Check initializing on Android with Develepment Build enabled."
        );

        DebugAppCheckProviderFactory.Instance.SetDebugToken("7C1EAF82-F125-431C-8525-24CF4AFEB128");
        FirebaseAppCheck.SetAppCheckProviderFactory(DebugAppCheckProviderFactory.Instance);
#else
        Debug.Log($"{nameof(FirebaseHelper)}: Firebase App Check initializing on Android.");

        FirebaseAppCheck.SetAppCheckProviderFactory(PlayIntegrityProviderFactory.Instance);
#endif

#endif

#if UNITY_IOS && !UNITY_EDITOR
        FirebaseAppCheck.SetAppCheckProviderFactory(AppAttestProviderFactory.Instance);
#endif

        app = FirebaseApp.DefaultInstance;
        Debug.Log($"{nameof(FirebaseHelper)}: Firebase App initialized with AppCheck.");

        return true;
    }

    // ==============================================================
    // Initialize Firebase Auth
    // ==============================================================
    public static async Task<bool> InitFirebaseAuth()
    {
        Debug.Log($"{nameof(FirebaseHelper)}: Initializing Firebase...");

        if (await GetAppAsync() == null)
        {
            Debug.LogError($"{nameof(FirebaseHelper)}: Firebase App not initialized.");
            return false;
        }

        Auth = FirebaseAuth.DefaultInstance;

        if (Auth != null)
        {
            Debug.Log($"{nameof(FirebaseHelper)}: Firebase initialized successfully.");
            return true;
        }
        else
        {
            Debug.LogError(
                $"{nameof(FirebaseHelper)}: Firebase Auth is not initialized after InitFirebaseAuth()."
            );
            return false;
        }
    }

    // ==============================================================
    // Sign in to Firebase
    // ==============================================================
    public static async Task<bool> SignInFirebase()
    {
        if (Auth == null)
            return false;

        Debug.Log($"{nameof(FirebaseHelper)}: Signing in...");

        if (Auth.CurrentUser == null)
        {
            Debug.Log($"{nameof(FirebaseHelper)}: Previous session not found");
#if DEVELOPMENT_BUILD
            await SignInFirebaseWithEmailAndPassword(
                GlobalSetting.TestUserEmail,
                GlobalSetting.TestUserPassword
            );

            return await SignInFirebase();
#endif
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
            Debug.LogWarning(
                $"{nameof(FirebaseHelper)}: Failed to verify Token, Signing user out..."
            );
            UserGlobalData.IDToken = null;
            Auth.SignOut();
            return true;
        }

        ToastController.Instance.ShowToast($"Welcome Back {Auth.CurrentUser.DisplayName}");

        return true;
    }

    private class VerifyIdTokenPayload : CustomWebRequest.WebRequestPayload
    {
        [JsonProperty("id_token")]
        public string IdToken;
    }
    private class VerifyIdTokenResponse : CustomWebRequest.WebRequestResponse { }

    public static async Task<bool> VerifyIdToken(string idToken, int retryCount = 0)
    {
        if (Auth == null)
        {
            Debug.Log($"{nameof(FirebaseHelper)}: Firebase Auth is not initialized");
            return false;
        }

        if (retryCount > GlobalSetting.MaxWebRequestFailedCount)
        {
            Debug.Log($"{nameof(FirebaseHelper)}: Token verification failed after retry.");
            return false;
        }

        if (retryCount == 0)
        {
            Debug.Log($"{nameof(FirebaseHelper)}: Verifying Token...");
        }

        string path = "verify_id_token/";
        var payload = new VerifyIdTokenPayload { IdToken = idToken };

        CustomWebRequest request = new(
            RequestMethod.POST,
            GlobalSetting.BaseUrl,
            path,
            payload,
            attachAppCheckToken: true
        );

        bool result = await request.SendRequest<VerifyIdTokenPayload, VerifyIdTokenResponse>();

        if (!result)
        {
            string responseText = request.LogResponse<VerifyIdTokenResponse>();
            if (!string.IsNullOrEmpty(responseText) && responseText.Contains("Token used too early"))
            {
                retryCount++;
                Debug.LogWarning(
                    $"{nameof(FirebaseHelper)}: id_token used too early. Retrying... {retryCount}"
                );
                await Task.Delay(GlobalSetting.WebRequestRetryCooldown); // Wait a moment before retrying

                return await VerifyIdToken(idToken, retryCount);
            }
            Debug.LogError($"{nameof(FirebaseHelper)}: Web Request Failed:\n" +
                   $"{request.LogResponse<VerifyIdTokenResponse>()}");
            return false;
        }

        if (request.Response.Success)
        {
            Debug.Log($"{nameof(FirebaseHelper)}: Token Verified");
            return true;
        }
        else
        {
            Debug.LogError(
                $"{nameof(FirebaseHelper)}: Failed to verify Token:\n"
                    + $"{request.LogResponse<VerifyIdTokenResponse>()}"
            );
            return false;
        }
    }

    public static async Task SignInFirebaseWithEmailAndPassword(string email, string password)
    {
        if (Auth == null)
            return;

        Debug.Log($"{nameof(FirebaseHelper)}: Signing in with email and password...");

        try
        {
            AuthResult result = await Auth.SignInWithEmailAndPasswordAsync(email, password);
            FirebaseUser newUser = result.User;
            if (newUser == null)
            {
                Debug.LogError(
                    $"{nameof(FirebaseHelper)}: SignInWithEmailAndPasswordAsync completed but returned null user."
                );
                return;
            }
            Debug.Log(
                $"{nameof(FirebaseHelper)}: User signed in successfully: {newUser.DisplayName ?? newUser.Email}"
            );
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
                    Debug.LogError(
                        $"{nameof(FirebaseHelper)}: Network error. Please check your connection."
                    );
                    return;

                default:
                    Debug.LogError(
                        $"{nameof(FirebaseHelper)}: Firebase sign-in error: {e.Message}"
                    );
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
    private class VerifyAppCheckTokenResponse : CustomWebRequest.WebRequestResponse { }

    public static async Task<bool> VerifyAppCheckToken(int retryCount = 0)
    {
        if (retryCount > GlobalSetting.MaxWebRequestFailedCount)
        {
            Debug.LogError(
                $"{nameof(FirebaseHelper)}: App Check token verification failed after {GlobalSetting.MaxWebRequestFailedCount} retries."
            );
            return false;
        }

        string path = "verify_app_check_token/";
        CustomWebRequest request = new(
            RequestMethod.GET,
            GlobalSetting.BaseUrl,
            path,
            null,
            attachAppCheckToken: true
        );

        bool result = await request.SendRequest<CustomWebRequest.WebRequestPayload, VerifyAppCheckTokenResponse>();

        if (!result)
        {
            string errorLog = request.LogResponse<VerifyAppCheckTokenResponse>();
            if (errorLog.Contains("The token is not yet valid (iat)"))
            {
                retryCount++;
                Debug.LogWarning(
                    $"{nameof(FirebaseHelper)}: App Check token is invalid or expired. Retrying... {retryCount}"
                );
                await Task.Delay(GlobalSetting.WebRequestRetryCooldown); // Wait a moment before retrying
                return await VerifyAppCheckToken(retryCount);
            }

            Debug.LogError($"{nameof(FirebaseHelper)}: Web Request Failed:\n" +
                $"{errorLog}");
            return false;
        }

        if (request.Response.Success)
        {
            Debug.Log($"{nameof(FirebaseHelper)}: App Check Token Verified");
            return true;
        }
        else
        {
            Debug.LogError(
                $"{nameof(FirebaseHelper)}: Failed to verify App Check Token:\n"
                    + $"{request.LogResponse<VerifyAppCheckTokenResponse>()}"
            );
            return false;
        }
    }
}
