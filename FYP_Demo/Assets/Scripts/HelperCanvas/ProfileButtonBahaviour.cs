
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

using System.Collections.Generic;
using UnityEditor.Build;
using UnityEngine.InputSystem;

[RequireComponent(typeof(Button))]
public class ProfileButtonBahaviour : MonoBehaviour
{
    [SerializeField] private GameObject loginCanvasPrefab;

    private GameObject loginCanvasInstance;

    private Queue<CanvasGroup> canvasGroupRecorder = new();
    private Button button;

    private void Awake()
    {
        TryGetComponent(out button);
    }
    private void OnEnable()
    {
        button.onClick.AddListener(OnClick);
    }
    private void Start()
    {
        if (button == null)
        {
            AppendError($"{GetType().Name}: Button component not found in {gameObject.name}");
        }


        if (hasError)
        {
            LogError();
        }
    }
    // private method
    private void OnClick()
    {
        loginCanvasInstance = Instantiate(loginCanvasPrefab);
        DisableOtherCanvas();

        loginCanvasInstance.GetComponent<LoginCanvasBehaviour>().SetCanvasGroupRecorder(canvasGroupRecorder);
    }
    private void DisableOtherCanvas()
    {
        for (int i = 0; i < SceneManager.loadedSceneCount; ++i)
        {
            Scene scene = SceneManager.GetSceneAt(i);
            GameObject[] roots = scene.GetRootGameObjects();
            foreach (GameObject root in roots)
            {
                if (root.CompareTag("MainCanvas"))
                {
                    if (!root.TryGetComponent(out CanvasGroup cg))
                    {
                        cg = root.AddComponent<CanvasGroup>();
                    }

                    cg.interactable = false;
                    cg.blocksRaycasts = false;
                    canvasGroupRecorder.Enqueue(cg);
                }
            }
        }

        GameObject helperCanvas = GameObject.FindGameObjectWithTag("HelperCanvas");
        if (!helperCanvas.TryGetComponent(out CanvasGroup helperCanvasGroup))
        {
            helperCanvasGroup = helperCanvas.AddComponent<CanvasGroup>();
        }

        helperCanvasGroup.interactable = false;
        helperCanvasGroup.blocksRaycasts = false;
        canvasGroupRecorder.Enqueue(helperCanvasGroup);
    }
    // Error Helper
    private bool hasError;
    private List<string> errorMessage = new();
    private void AppendError(string message)
    {
        hasError = true;
        errorMessage.Add(message);
        Debug.LogError(message);
    }
    private void LogError()
    {
        if (hasError && errorMessage.Count > 0)
        {
            string message = "";
            foreach (var error in errorMessage)
            {
                message += error + "\n";
            }

            Debug.LogError($"{GetType().Name}: Error(s): caught...\n"
                           + message);
        }
    }
}
