
using System;
using System.Collections;
using System.Threading.Tasks;

using UnityEngine;
using UnityEngine.Networking;

using Firebase.Auth;
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
        StartCoroutine(Initialization(
            failure:() => ToastController.Instance.ShowToast("Failed to connect to Firebase. Please try again later."),
            progress: (progress) => progressBar.SetProgress(progress)
            ));
    }

    IEnumerator Initialization(Action failure, Action<float> progress)
    {
        Debug.Log($"{GetType().Name}: Initializing...");
        progress?.Invoke(.1f);
        yield return StartCoroutine(DisplayMessage("Initializing..."));

        // Initialize Firebase
        yield return StartCoroutine(DisplayMessage("Initializing FireBase..."));

        Task initFirebaseTask = InitFirebase();
        while (!initFirebaseTask.IsCompleted) yield return null;

        if (auth == null)
        {
            Debug.LogError($"{GetType().Name}: Firebase Auth is not initialized.");
            yield return StartCoroutine(DisplayMessage("Failed to initialize FireBase..."));
            failure.Invoke();
            yield break;
        }

        progress?.Invoke(.3f);
        yield return StartCoroutine(DisplayMessage("Firebase initialized successfully."));

        // Sign in to Firebase
        progress?.Invoke(.4f);
        yield return StartCoroutine((DisplayMessage("Signing in...")));

        Task signInFirebaseTask = SignInFirebase();
        while (!signInFirebaseTask.IsCompleted) yield return null;

        if (auth.CurrentUser == null)
        {
            Debug.LogError($"{GetType().Name}: No user is signed in.");
            yield return StartCoroutine(DisplayMessage("Previous Session not found continue as Guest..."));
            yield break;
        }

        progress?.Invoke(.6f);
        yield return StartCoroutine(DisplayMessage("User signed in successfully."));


        // Generate ID_Token for the current user
        progress?.Invoke(.7f);
        yield return StartCoroutine(DisplayMessage("Generating ID Token..."));

        var tokenTask = auth.CurrentUser.TokenAsync(true);
        while (!tokenTask.IsCompleted) yield return null;

        if (tokenTask.IsFaulted || tokenTask.IsCanceled || string.IsNullOrEmpty(tokenTask.Result))
        {
            if (tokenTask.IsFaulted || tokenTask.IsCanceled)
            {
                Debug.LogError("Failed to get token: " + tokenTask.Exception);
            }
            else
            {
                Debug.LogError($"{GetType().Name}: ID Token is null or empty after Sign-in.");
            }

            yield return StartCoroutine(DisplayMessage("Failed to generate ID Token, continue as Guest..."));
            yield break;
        }

        GlobalData.IDToken = tokenTask.Result;

        Debug.Log($"{GetType().Name}: ID Token: {GlobalData.IDToken}");
        progress?.Invoke(.9f);
        yield return StartCoroutine(DisplayMessage("ID Token Generated..."));

        // small delay before verifying the ID Token to prevent Firebase timing errors
        yield return new WaitForSeconds(GlobalSetting.AuthenticationCooldown);


        // Verify the ID Token
        progress?.Invoke(.95f);
        yield return StartCoroutine(DisplayMessage("Verifying ID Token..."));

        Task<bool> verifyIdTokenTask = VerifyIdToken(GlobalData.IDToken);
        while (!verifyIdTokenTask.IsCompleted) yield return null;

        if (!verifyIdTokenTask.Result)
        {
            Debug.LogWarning($"{GetType().Name}: Failed to verify Token, Signing user out...");
            GlobalData.IDToken = null;
            auth.SignOut();
            yield return StartCoroutine(DisplayMessage("Failed to generate ID Token, continue as Guest..."));
            yield break;
        }

        progress?.Invoke(1f);
        yield return StartCoroutine(DisplayMessage("ID Token Verified..."));

        ToastController.Instance.ShowToast($"Welcome Back {auth.CurrentUser.DisplayName}");
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

        string path = "verify_id_token/";

        using UnityWebRequest request = new(GlobalSetting.BaseUrl + path, "POST");
        request.timeout = 10;
        request.SetRequestHeader("Authorization", "Bearer " + idToken);
        request.downloadHandler = new DownloadHandlerBuffer();

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
    IEnumerator DisplayMessage(string msg)
    {
        if (!msgOutput) yield break;

        initMsgInputField.text = msg;
        yield return new WaitForSeconds(GlobalSetting.msgCountdown);

    }
}
