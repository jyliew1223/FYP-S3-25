
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

using System.Collections.Generic;
using System.Collections;

public class ARSceneFlowManager : MonoBehaviour
{
    [SerializeField] private SceneTransition loadingSceneTransition;
    [SerializeField] private SceneTransition _ARSceneTransition;
    [SerializeField] private SceneTransition returnTransition;
    [SerializeField] private float waitingTime = 1f;
    [SerializeField][Tag] private string _ARSceneReturnButtonTag = "ARSceneReturnButton";

    private string loadingSceneName;
    private string _ARSceneName;

    private Queue<GameObject> objectRecorder = new();
    private Scene _ARScene;

    private string message { get; set; }

    private void Start()
    {
        if (loadingSceneTransition != null)
        {
            loadingSceneName = loadingSceneTransition.GetSceneToLoad();
        }
        else
        {
            AppendError($"{GetType().Name}: Loading Scene not set");
        }

        if (_ARSceneTransition != null)
        {
            _ARSceneName = _ARSceneTransition.GetSceneToLoad();
        }
        else
        {
            AppendError($"{GetType().Name}: AR Scene not set");
        }

        if (hasError)
        {
            LogError();
        }

        DontDestroyOnLoad(gameObject);
    }
    //public method
    public void ChangeScene()
    {
        if (hasError)
        {
            LogError();
        }

        StartCoroutine(StartLoadingARScene());
    }

    public void Return()
    {
        GameObject[] roots = SceneManager.GetActiveScene().GetRootGameObjects();
        foreach (GameObject obj in roots)
        {
            if (obj.name == "EventSystem")
            {
                Destroy(obj);
            }
        }

        EnableDisabledObjects();

        StartCoroutine(ReturnFromARScene());
    }
    //private method
    private IEnumerator StartLoadingARScene()
    {
        yield return StartCoroutine(LoadScene(loadingSceneName, progress => { }));

        Slider progressBar = null;
        GameObject[] roots = SceneManager.GetSceneByName(loadingSceneName).GetRootGameObjects();
        foreach (var root in roots)
        {
            progressBar = root.GetComponentInChildren<Slider>();
            if (progressBar != null)
            {
                break;
            }
        }

        DisableHelperCanvas();

        yield return StartCoroutine(loadingSceneTransition.StartTransition());

        DisableAllOtherScene(loadingSceneName);

        yield return StartCoroutine(LoadScene(_ARSceneName, progress =>
        {
            if (progressBar != null)
            {
                progressBar.value = progress;
            }
        }));

        yield return new WaitForSeconds(waitingTime);

        yield return StartCoroutine(_ARSceneTransition.StartTransition());

        _ARScene = SceneManager.GetSceneByName(_ARSceneName);

        Button returnButton = null;
        roots = _ARScene.GetRootGameObjects();
        foreach (GameObject root in roots)
        {
            GameObject found = FindTagInChildrenRecursive(root, _ARSceneReturnButtonTag);
            if (found != null)
            {
                found.TryGetComponent(out returnButton);

                if (returnButton != null)
                {
                    break;
                }
            }
        }

        returnButton.onClick.RemoveAllListeners();
        returnButton.onClick.AddListener(Return);
    }
    private IEnumerator LoadScene(string sceneName, System.Action<float> progressCallback)
    {
        AsyncOperation loadOp = SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Additive);

        while (!loadOp.isDone)
        {
            progressCallback?.Invoke(loadOp.progress);
            yield return null;
        }
    }

    private IEnumerator ReturnFromARScene()
    {
        yield return StartCoroutine(returnTransition.StartTransition());
    }
    private void DisableAllOtherScene(string whiteListSceneName)
    {
        for (int i = 0; i < SceneManager.loadedSceneCount; ++i)
        {
            Scene scene = SceneManager.GetSceneAt(i);
            if (scene.name == whiteListSceneName) continue;

            GameObject[] roots = scene.GetRootGameObjects();
            foreach (GameObject root in roots)
            {
                objectRecorder.Enqueue(root);
                root.SetActive(false);
            }
        }
    }
    private void DisableHelperCanvas()
    {
        GameObject helperCanvas = GameObject.FindGameObjectWithTag("HelperCanvas");
        objectRecorder.Enqueue(helperCanvas);
        helperCanvas.SetActive(false);
    }
    private void EnableDisabledObjects()
    {
        while (objectRecorder.Count > 0)
        {
            GameObject obj = objectRecorder.Dequeue();
            obj.SetActive(true);
        }
    }

    private GameObject FindTagInChildrenRecursive(GameObject obj, string tag)
    {
        if (obj.CompareTag(tag))
        {
            return obj;
        }

        foreach (Transform child in obj.transform)
        {
            GameObject result = FindTagInChildrenRecursive(child.gameObject, tag);
            if (result != null)
            {
                return result;
            }
        }

        return null;
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
