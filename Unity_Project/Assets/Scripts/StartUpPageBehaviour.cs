using System;
using System.Collections;
using System.Threading.Tasks;
using UnityEngine;
using Firebase.Auth;
using Firebase;
using UnityEngine.Networking;

public class StartUpPageBehaviour : MonoBehaviour
{
    private FirebaseAuth auth;

    void Start()
    {
        StartCoroutine(Initialization());
    }
    void OnDestroy()
    {
        if (auth != null)
        {
            auth.Dispose();
            auth = null;
            Debug.Log($"{GetType().Name}: FirebaseAuth disposed.");
        }
    }
    IEnumerator Initialization()
    {

        Debug.Log($"{GetType().Name}: Initializing...");

        Task initFirebaseTask = InitFirebase();
        while (!initFirebaseTask.IsCompleted) yield return null;

        if (auth == null)
        {
            Debug.LogError($"{GetType().Name}: Firebase Auth is not initialized.");
            yield break;
        }

        Task signInFirebaseTask = SignInFirebase();
        while (!signInFirebaseTask.IsCompleted) yield return null;

        if (String.IsNullOrEmpty(GlobalData.IDToken))
        {
            Debug.LogError($"{GetType().Name}: ID Token is null or empty after Sign-in.");
            yield break;
        }

        Debug.Log($"{GetType().Name}: ID Token: {GlobalData.IDToken}");

        yield return new WaitForSeconds(10);

        Task<bool> verifyIdTokenTask = VerifyIdToken(GlobalData.IDToken);
        while (!verifyIdTokenTask.IsCompleted) yield return null;

        if (!verifyIdTokenTask.Result)
        {
            Debug.LogWarning($"{GetType().Name}: Failed to verify Token, Signing user out...");
            auth.SignOut();
        }
    }

    async Task InitFirebase()
    {

        Debug.Log($"{GetType().Name}: Initializing Firebase...");

        var dependencyStatus = await Firebase.FirebaseApp.CheckAndFixDependenciesAsync();
        if (dependencyStatus == Firebase.DependencyStatus.Available)
        {
            auth = FirebaseAuth.DefaultInstance;
            Debug.Log($"{GetType().Name}: Firebase initialized successfully.");
        }
        else
        {
            Debug.LogError($"{GetType().Name}: Could not resolve all Firebase dependencies: {dependencyStatus}");
        }
    }

    async Task SignInFirebase()
    {
        if (auth == null) return;

        Debug.Log($"{GetType().Name}: Signing in...");

        if (auth.CurrentUser == null)
        {
            Debug.Log($"{GetType().Name}: Previous session not found");
            await SignInFirebaseWithEmailAndPassword("testuser002@gmail.com", "testuser002");
        }
        else
        {
            Debug.Log($"{GetType().Name}: Previous session found");
        }

        GlobalData.IDToken = auth.CurrentUser != null ? await auth.CurrentUser.TokenAsync(true) : string.Empty;
    }

    async Task SignInFirebaseWithEmailAndPassword(string email, string password)
    {
        if (auth == null) return;

        Debug.Log($"{GetType().Name}: Signing in with email and password...");

        try
        {
            AuthResult result = await auth.SignInWithEmailAndPasswordAsync(email, password);
            FirebaseUser newUser = result.User;
            if (newUser == null)
            {
                Debug.LogError($"{GetType().Name}: SignInWithEmailAndPasswordAsync completed but returned null user.");
                return;
            }
            Debug.Log($"{GetType().Name}: User signed in successfully: {newUser.DisplayName ?? newUser.Email}");
        }
        catch (FirebaseException e)
        {
            var errorCode = (AuthError)e.ErrorCode;

            switch (errorCode)
            {
                case AuthError.InvalidEmail:
                case AuthError.WrongPassword:
                case AuthError.UserNotFound:
                    Debug.LogError($"{GetType().Name}: Invalid credentials provided.");
                    return;

                case AuthError.NetworkRequestFailed:
                    Debug.LogError($"{GetType().Name}: Network error. Please check your connection.");
                    return;

                default:
                    Debug.LogError($"{GetType().Name}: Firebase sign-in error: {e.Message}");
                    return;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"{GetType().Name}: Unexpected error during sign-in: {e}");
            return;
        }
    }

    internal class VerifyIdTokenResponse
    {
        public bool success;
        public string message;
    }
    async Task<bool> VerifyIdToken(string idToken, int retryCount = 0)
    {
        if (retryCount > 10)
        {
            Debug.LogError($"{GetType().Name}: Token verification failed after retry.");
            return false;
        }

        if (retryCount == 0)
        {
            Debug.Log($"{GetType().Name}: Verifying Token...");
        }

        string path = "verify_id_token/";

        using UnityWebRequest request = new(GlobalSetting.BaseUrl + path, "POST");
        request.timeout = 10;
        request.SetRequestHeader("Authorization", "Bearer " + idToken);
        request.downloadHandler = new DownloadHandlerBuffer();

        try
        {
            var operation = request.SendWebRequest();
            while (!operation.isDone) await Task.Yield();

            string jsonResponse = request.downloadHandler.text;
            VerifyIdTokenResponse response = JsonUtility.FromJson<VerifyIdTokenResponse>(jsonResponse);

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"{GetType().Name}: HTTP Error: " + request.error);

                if (!string.IsNullOrEmpty(response.message))
                    Debug.LogError($"{GetType().Name}: HTTP Error message: {response.message}");

                return false;
            }

            if (response.success)
            {
                Debug.Log($"{GetType().Name}: Token Verified");
                return true;
            }
            else if (response.message.Contains("expired"))
            {
                Debug.Log($"{GetType().Name}: Token expired. Refreshing...");

                GlobalData.IDToken = await auth.CurrentUser.TokenAsync(true);

                return await VerifyIdToken(GlobalData.IDToken, retryCount + 1);
            }
            else
            {
                Debug.LogError($"{GetType().Name}: Failed to verify:" + response.message);
                return false;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"{GetType().Name}: Exception during HTTP request: {e}");
            return false;
        }

        return false;
    }

    async Task<bool> SignupFirebaseWithEmailAndPassword(string email, string password)
    {
        if (auth == null) return false;

        try
        {
            AuthResult result = await auth.CreateUserWithEmailAndPasswordAsync(email, password);
            FirebaseUser newUser = result.User;
            if (newUser == null)
            {
                Debug.LogError(
                    $"{GetType().Name}: CreateUserWithEmailAndPasswordAsync completed but returned null user.");
                return false;
            }

            Debug.Log($"{GetType().Name}: User signed up successfully: {newUser.DisplayName ?? newUser.Email}");
            return true;
        }
        catch (FirebaseException e)
        {
            var errorCode = (AuthError)e.ErrorCode;
            switch (errorCode)
            {
                case AuthError.EmailAlreadyInUse:
                    Debug.LogError($"{GetType().Name}: Email already in use. Please try a different email.");
                    return false;
                case AuthError.InvalidEmail:
                    Debug.LogError($"{GetType().Name}: Invalid email format.");
                    return false;
                case AuthError.WeakPassword:
                    Debug.LogError($"{GetType().Name}: Password is too weak. Please choose a stronger password.");
                    return false;
                case AuthError.NetworkRequestFailed:
                    Debug.LogError($"{GetType().Name}: Network error. Please check your connection.");
                    return false;
                default:
                    Debug.LogError($"{GetType().Name}: Firebase sign-up error: {e.Message}");
                    return false;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"{GetType().Name}: Error during sign-up: {e}");
            return false;
        }

        return false;
    }

    internal class SignUpResponse
    {
        public bool success;
        public string message;
    }
    internal class SignUpRequest
    {
        public string id_token;
        public string full_name;
        public string email;
    }
    async Task<bool> SignUpUser(string idToken, string fullName, string email)
    {
        //INPUT:{
        //    "id_token": str,
        //    "full_name": str,
        //    "email": str
        //}
        //OUTPUT:{
        //    "success": bool,
        //    "message": str
        //}"
        
        using UnityWebRequest request = new(GlobalSetting.BaseUrl + "signup/", "POST");
        request.timeout = 10;
        request.SetRequestHeader("Authorization", "Bearer " + idToken);
        request.SetRequestHeader("Content-Type", "application/json");

        SignUpRequest reqData = new SignUpRequest
        {
            id_token = idToken,
            full_name = fullName,
            email = email
        };

        string jsonData = JsonUtility.ToJson(reqData);
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);

        request.downloadHandler = new DownloadHandlerBuffer();

        try
        {
            var operation = request.SendWebRequest();
            while (!operation.isDone)
                await Task.Yield();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"{GetType().Name}: Signup request failed: {request.error}");
                return false;
            }

            SignUpResponse response = JsonUtility.FromJson<SignUpResponse>(request.downloadHandler.text);
            if (response.success)
            {
                Debug.Log($"{GetType().Name}: User signed up successfully: {response.message}");
                return true;
            }
            else
            {
                Debug.LogError($"{GetType().Name}: Sign-up failed: {response.message}");
                return false;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"{GetType().Name}: Exception during HTTP request: {e}");
            return false;
        }

        return false;
    }
}
