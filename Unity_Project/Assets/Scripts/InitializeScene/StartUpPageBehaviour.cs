using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TMPro;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

public class StartUpPageBehaviour : MonoBehaviour
{
#if UNITY_EDITOR
    [SerializeField]
    private SceneAsset mainSceneAsset;

    private void OnValidate()
    {
        if (mainSceneAsset != null)
        {
            nextScene = mainSceneAsset.name;
        }
    }
#endif

    [ReadOnly]
    [SerializeField]
    private string nextScene;

    [System.Serializable]
    private class PostInitPrefab
    {
        public GameObject Prefab;
        public bool ShowWhenDone;
    }

    [SerializeField]
    private TextMeshProUGUI initMsgInputField;

    [SerializeField]
    private ProgressBar progressBar;

    [SerializeField]
    private PostInitPrefab[] postInitPrefabs;
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
    }

    void Start()
    {
        Initialization(
            failure: () =>
                ToastController.Instance.ShowToast("Failed to initialize. Please try again later."),
            progress: (progress) => progressBar.Progress = progress
        );
    }

    private class InitStep
    {
        public string Name { get; }
        public string IntroMessage { get; }
        public string SuccessMessage { get; }
        public string FailureMessage { get; }
        public Func<Task<bool>> TaskFunc { get; }

        public InitStep(
            string name,
            string introMessage,
            string successMessage,
            string failureMessage,
            Func<Task<bool>> taskFunc
        )
        {
            this.Name = name;
            this.IntroMessage = introMessage;
            this.SuccessMessage = successMessage;
            this.FailureMessage = failureMessage;
            this.TaskFunc = taskFunc;
        }
    }

    async void Initialization(Action failure, Action<float> progress)
    {
        Debug.Log($"{GetType().Name}: Initializing...");
        await DisplayMessage("Initializing...");

        progress?.Invoke(.01f);

        List<InitStep> initSteps = new()
        {
            new InitStep(
                name: "InitFirebaseWithAppCheck",
                introMessage: "Initializing Firebase (with App Check)...",
                successMessage: "Firebase initialized with App Check.",
                failureMessage: "Failed to initialize Firebase with App Check.",
                taskFunc: FirebaseHelper.InitFirebaseWithAppCheck
            ),
            new InitStep(
                name: "InitFirebaseAuth",
                introMessage: "Initializing Firebase...",
                successMessage: "Firebase Auth initialized.",
                failureMessage: "Failed to initialize Firebase Auth.",
                taskFunc: FirebaseHelper.InitFirebaseAuth
            ),
            new InitStep(
                name: "VerifyAppCheckToken",
                introMessage: "Verifying App Check token...",
                successMessage: "App Check token verified.",
                failureMessage: "Failed to verify App Check token.",
                taskFunc: () => FirebaseHelper.VerifyAppCheckToken(0)
            ),
            new InitStep(
                name: "SignInFirebase",
                introMessage: "Signing in to Firebase...",
                successMessage: "Signed in to Firebase.",
                failureMessage: "Failed to sign in to Firebase.",
                taskFunc: FirebaseHelper.SignInFirebase
            ),
            new InitStep(
                name: "PostInitPrefabs",
                introMessage: "Starting up app...",
                successMessage: "Welcome back!\nHarness on, chalk up, and dive into the crag chatter!",
                failureMessage: "Failed to startup app.",
                taskFunc: async () =>
                {
                    Queue<(GameObject go, bool active)> cachedGameObjects = new();
                    foreach (PostInitPrefab postInitPrefab in postInitPrefabs)
                    {
                        GameObject gameObject = Instantiate(postInitPrefab.Prefab);

                        cachedGameObjects.Enqueue((gameObject, postInitPrefab.ShowWhenDone));
                    }

                    await Task.Yield(); // Wait for a short duration to ensure all prefabs are initialized

                    while (cachedGameObjects.Count > 0)
                    {
                        (GameObject gameObject, bool active) = cachedGameObjects.Dequeue();
                        gameObject.SetActive(active);

                        await Task.Yield(); // Yield control to allow other tasks to run
                    }
                    return true;
                }
            ),
        };

        try
        {
            for (int i = 0; i < initSteps.Count; i++)
            {
                var taskFunc = initSteps[i].TaskFunc;
                bool success = await taskFunc();

                progress.Invoke((i + 1) / (float)initSteps.Count);

                if (!success)
                {
                    Debug.LogError(
                        $"{GetType().Name}: Initialization step {initSteps[i].Name} failed."
                    );
                    await DisplayMessage(initSteps[i].FailureMessage);
                    failure?.Invoke();
                    return;
                }
                else
                {
                    await DisplayMessage(initSteps[i].SuccessMessage);
                }
            }
        }
        catch (Exception ex)
        {
            Debug.LogError($"{GetType().Name}: Initialization failed with exception:\n{ex}");
            await DisplayMessage($"Initialization failed due to an unexpected error:");
            failure?.Invoke();
            return;
        }

        await Task.Delay(2000);

        SceneManager.LoadScene(nextScene);
    }

    async Task DisplayMessage(string msg)
    {
        if (!msgOutput)
            return;

        initMsgInputField.text = msg;
        await Task.Delay((int)GlobalSetting.msgCountdown * 1000);
    }
}
