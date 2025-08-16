
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;

using UnityEngine;
using UnityEngine.Networking;

using Firebase.Auth;
using Firebase.AppCheck;
using Firebase;

using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

using TMPro;

public class StartUpPageBehaviour : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI initMsgInputField;
    [SerializeField] private ProgressBar progressBar;

    private FirebaseAuth auth;
    private bool msgOutput = true;

    private void Awake()
    {
        if (initMsgInputField == null)
        {
            msgOutput = false;
            Debug.LogWarning($"{GetType().Name}: initMsgInputField not set!");
        }
        if (progressBar == null)
        {
            Debug.LogWarning($"{GetType().Name}: progressBar not set!");
        }
        else
        {
            progressBar.SetProgress(.0f);
        }
    }

    void Start()
    {
        Initialization(
            failure: () => ToastController.Instance.ShowToast("Failed to connect to Firebase. Please try again later."),
            progress: (progress) => progressBar.SetProgress(progress)
            );
    }

    async void Initialization(Action failure, Action<float> progress)
    {
        Debug.Log($"{GetType().Name}: Initializing...");
        progress?.Invoke(.1f);
        await DisplayMessage("Initializing...");

        // ==============================================================
        // Initialize Firebase Auth
        // ==============================================================
        await DisplayMessage("Initializing FireBase Auth...");

        await InitFirebaseAuth();

        if (auth == null)
        {
            Debug.LogError($"{GetType().Name}: Firebase Auth is not initialized.");
            await DisplayMessage("Failed to initialize FireBase Auth...");
            failure.Invoke();
            return;
        }

        progress?.Invoke(.2f);
        await DisplayMessage("Firebase Auth initialized successfully.");
        // ==============================================================

        // ==============================================================
        // Initialize Firebase App Check
        // ==============================================================
        await DisplayMessage("Initializing FireBase App Check...");

        InitFirebaseAppCheck();

        if (FirebaseAppCheck.DefaultInstance == null)
        {
            Debug.LogError($"{GetType().Name}: Firebase App Check is not initialized.");
            await DisplayMessage("Failed to initialize FireBase App Check...");
            failure.Invoke();
            return;
        }

        progress?.Invoke(.3f);
        await DisplayMessage("Firebase App Check initialized successfully.");
        // ==============================================================

        // ==============================================================
        // Obtain App Check Token for testing
        // ==============================================================
        await DisplayMessage("Obtaining App Check Token...");

        bool verifyAppCheckTaskResult = await VerifyAppCheckToken();

        if (!verifyAppCheckTaskResult)
        {
            Debug.LogError($"{GetType().Name}: Failed to verify App Check Token.");
            await DisplayMessage("Failed to verify App Check Token...");
            failure.Invoke();
            return;
        }
        // ==============================================================
        // Sign in to Firebase
        // ==============================================================
        progress?.Invoke(.4f);
        await (DisplayMessage("Signing in..."));

        await SignInFirebase();

        if (auth.CurrentUser == null)
        {
            // ==============================================================
            // End user session if no user is signed in
            // ==============================================================
            Debug.LogError($"{GetType().Name}: No user is signed in.");
            await DisplayMessage("Previous Session not found continue as Guest...");

            progress?.Invoke(1f);
        }
        else
        {
            progress?.Invoke(.6f);
            await DisplayMessage("User signed in successfully.");
            // ==============================================================


            // ==============================================================
            // Generate ID_Token for the current user if user found
            // ==============================================================
            progress?.Invoke(.7f);
            await DisplayMessage("Generating ID Token...");

            try
            {
                string token = await auth.CurrentUser.TokenAsync(true);
                GlobalData.IDToken = token;
            }
            catch (Exception e)
            {
                Debug.LogError("Failed to get ID Token: " + e);
                return;
            }


            Debug.Log($"{GetType().Name}: ID Token: {GlobalData.IDToken}");
            progress?.Invoke(.9f);
            await DisplayMessage("ID Token Generated...");
            // ==============================================================

            // small delay before verifying the ID Token to prevent Firebase timing errors
            await Task.Delay((int)(GlobalSetting.AuthenticationCooldown * 1000));

            // ==============================================================
            // Verify the ID Token
            // ==============================================================
            progress?.Invoke(.95f);
            await DisplayMessage("Verifying ID Token...");

            bool verifyIdTokenTaskResult = await VerifyIdToken(GlobalData.IDToken);

            if (!verifyIdTokenTaskResult)
            {
                Debug.LogWarning($"{GetType().Name}: Failed to verify Token, Signing user out...");
                GlobalData.IDToken = null;
                auth.SignOut();
                await DisplayMessage("Failed to generate ID Token, continue as Guest...");
                return;
            }

            progress?.Invoke(1f);
            await DisplayMessage("ID Token Verified...");
            // ==============================================================

            ToastController.Instance.ShowToast($"Welcome Back {auth.CurrentUser.DisplayName}");
        }
    }

    async Task InitFirebaseAuth()
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

    void InitFirebaseAppCheck()
    {
        Debug.Log($"{GetType().Name}: Initializing Firebase App Check...");
        try
        {
#if UNITY_EDITOR
            string path = Path.Combine(Application.streamingAssetsPath, "secrets.json");
            string json = File.ReadAllText(path);

            JObject secrets = JObject.Parse(json);
            string debugToken = secrets["debug_token"]?.ToString();
            if (string.IsNullOrEmpty(debugToken))
            {
                Debug.LogError($"{GetType().Name}: Debug token not found in secrets.json");
                return;
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
            Debug.Log($"{GetType().Name}: Firebase App Check initialized successfully.");

        }
        catch (Exception e)
        {
            Debug.LogError($"{GetType().Name}: Failed to initialize Firebase App Check: {e.Message}");
        }
    }

    private record VerifyAppCheckTokenResponse
    {
        public bool success;
        public string message;
        public string errors;
    }
    async Task<bool> VerifyAppCheckToken()
    {
        Debug.Log($"{GetType().Name}: Obtaining App Check token...");

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
                        Debug.LogError($"{GetType().Name}: Verify request failed: {request.error}:\n{formattedErrors}");
                    }
                    catch (JsonReaderException e)
                    {
                        Debug.LogError($"{GetType().Name}: Failed to parse error JSON: {e.Message}\nRaw error string: {response.errors}");
                    }
                }
                else
                {
                    Debug.LogError($"{GetType().Name}: Verify request failed: {request.error}: {response.message ?? "No message..."}");
                }
                return false;
            }

            if (response.success)
            {
                Debug.Log($"{GetType().Name}: App Check Token Verified");
                return true;
            }
            else
            {
                Debug.LogError($"{GetType().Name}: Failed to verify App Check Token: {response.message}");
                return false;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"{GetType().Name}: Exception during HTTP request: {e}");
            return false;
        }
    }

    async Task SignInFirebase()
    {
        if (auth == null) return;

        Debug.Log($"{GetType().Name}: Signing in...");

        if (auth.CurrentUser == null)
        {
            Debug.Log($"{GetType().Name}: Previous session not found");
            await SignInFirebaseWithEmailAndPassword("testuser001@gmail.com", "testuser001");
        }
        else
        {
            Debug.Log($"{GetType().Name}: Previous session found");
        }
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

    private record VerifyIdTokenResponse
    {
        public bool success;
        public string message;
        public string errors;
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

        string path = $"verify_id_token/?id_token={UnityWebRequest.EscapeURL(idToken)}";

        using UnityWebRequest request = new(GlobalSetting.BaseUrl + path, "GET");
        
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");

        AppCheckToken appCheckToken = await FirebaseAppCheck.DefaultInstance.GetAppCheckTokenAsync(false);
        request.SetRequestHeader("X-Firebase-AppCheck", appCheckToken.Token);

        try
        {
            var operation = request.SendWebRequest();
            while (!operation.isDone) await Task.Yield();

            VerifyIdTokenResponse response = JsonUtility.FromJson<VerifyIdTokenResponse>(request.downloadHandler.text);

            if (request.result != UnityWebRequest.Result.Success)
            {
                if (!string.IsNullOrEmpty(response.errors))
                {
                    try
                    {
                        JObject parsedErrors = JObject.Parse(response.errors);
                        string formattedErrors = parsedErrors.ToString(Formatting.Indented);
                        Debug.LogError($"{GetType().Name}: Verify request failed: {request.error}:\n{formattedErrors}");
                    }
                    catch (JsonReaderException e)
                    {
                        Debug.LogError($"{GetType().Name}: Failed to parse error JSON: {e.Message}\nRaw error string: {response.errors}");
                    }
                }
                else
                {
                    Debug.LogError($"{GetType().Name}: Verify request failed: {request.error}: {response.message ?? "No message..."}");
                }

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

                _ = Task.Delay(500);

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
    }

    async Task DisplayMessage(string msg)
    {
        if (!msgOutput) return;

        initMsgInputField.text = msg;
        await Task.Delay((int)GlobalSetting.msgCountdown * 1000);
    }
}
