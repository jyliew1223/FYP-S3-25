
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;

using UnityEngine;
using UnityEngine.Networking;

using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

using TMPro;
using UnityEditor;
using NUnit.Framework;
using System.Collections.Generic;
using UnityEngine.SceneManagement;

public class StartUpPageBehaviour : MonoBehaviour
{
#if UNITY_EDITOR
    [SerializeField] private SceneAsset mainSceneAsset;
    private void OnValidate()
    {
        if (mainSceneAsset != null)
        {
            nextSceneName = mainSceneAsset.name;
        }
    }
#endif

    [System.Serializable]
    private class PostInitPrefab
    {
        public GameObject Prefab;
        public bool ShowWhenDone;
    }

    [SerializeField] private TextMeshProUGUI initMsgInputField;
    [SerializeField] private ProgressBar progressBar;
    [SerializeField] private PostInitPrefab[] postInitPrefabs;

    private string nextSceneName = "MainScene";
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
            failure: () => ToastController.Instance.ShowToast("Failed to initialize. Please try again later."),
            progress: (progress) => progressBar.Progress = progress
            );
    }

    private class InitStep
    {
        public string IntroMessage { get; }
        public string SuccessMessage { get; }
        public string FailureMessage { get; }
        public Func<Task<bool>> TaskFunc { get; }

        public InitStep(string introMessage, string successMessage, string failureMessage, Func<Task<bool>> taskFunc)
        {
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
                introMessage: "Initializing Firebase...",
                successMessage: "Firebase Auth initialized.",
                failureMessage: "Failed to initialize Firebase Auth.",
                taskFunc: FirebaseHelper.InitFirebaseAuth
            ),
            new InitStep(
                introMessage: "Initializing Firebase App Check...",
                successMessage: "Firebase App Check initialized.",
                failureMessage: "Failed to initialize Firebase App Check.",
                taskFunc: FirebaseHelper.InitFirebaseAppCheck
            ),
            new InitStep(
                introMessage: "Verifying App Check token...",
                successMessage: "App Check token verified.",
                failureMessage: "Failed to verify App Check token.",
                taskFunc: FirebaseHelper.VerifyAppCheckToken
            ),
            new InitStep(
                introMessage: "Signing in to Firebase...",
                successMessage: "Signed in to Firebase.",
                failureMessage: "Failed to sign in to Firebase.",
                taskFunc: FirebaseHelper.SignInFirebase
            ),
            new InitStep
            (
                introMessage: "Starting up app...",
                successMessage: "Welcome back!\nHarness on, chalk up, and dive into the crag chatter!",
                failureMessage: "Failed to startup app.",
                taskFunc:   async () =>
                    {
                        foreach (PostInitPrefab postInitPrefab in postInitPrefabs)
                        {
                            GameObject gameObject =Instantiate(postInitPrefab.Prefab);
                            gameObject.SetActive(postInitPrefab.ShowWhenDone);
                        }
                        await Task.Delay(500); // Wait for a short duration to ensure all prefabs are initialized
                        return true;
                    }
            )
        };

        for (int i = 0; i < initSteps.Count; i++)
        {
            var taskFunc = initSteps[i].TaskFunc;
            bool success = await taskFunc();

            progress.Invoke((i + 1) / (float)initSteps.Count);

            if (!success)
            {
                Debug.LogError($"{GetType().Name}: Initialization step {i + 1} failed.");
                await DisplayMessage(initSteps[i].FailureMessage);
                failure?.Invoke();
                return;
            }
            else
            {
                await DisplayMessage(initSteps[i].SuccessMessage);
            }
        }

        await Task.Delay(2000);

        SceneManager.LoadScene(nextSceneName);
    }

    async Task DisplayMessage(string msg)
    {
        if (!msgOutput) return;

        initMsgInputField.text = msg;
        await Task.Delay((int)GlobalSetting.msgCountdown * 1000);
    }
}
