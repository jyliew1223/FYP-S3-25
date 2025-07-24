#if UNITY_EDITOR
using UnityEditor;
#endif

using UnityEngine;
using UnityEngine.SceneManagement;

using System.Collections;
using System.Collections.Generic;

public class SceneTransition : MonoBehaviour
{
    public enum TransitionType
    {
        SlideToLeft,
        SlideToRight,
        Fade,
        None
    }

#if UNITY_EDITOR
    [SerializeField] private SceneAsset nextScene;
    private void OnValidate()
    {
        sceneToLoad = nextScene.name;
    }
#endif

    [SerializeField][ReadOnly] private string sceneToLoad;
    [SerializeField][Tag] private string currentSceneMainContainerTag = "MainContainer";
    [SerializeField][Tag] private string nextSceneMainContainerTag = "MainContainer";

    [SerializeField] private TransitionType currentSceneTransition = TransitionType.SlideToLeft;
    [SerializeField] private TransitionType newSceneTransition = TransitionType.SlideToLeft;
    [SerializeField] private float slideDuration = .5f;
    [SerializeField] private bool unloadScene = true;

    public static event System.Action OnTransitionStart;
    public static event System.Action<Scene> OnTransitionEnd;

    // runtime logic
    private void Start()
    {
        if (string.IsNullOrEmpty(sceneToLoad))
        {
            AppendError($"{GetType().Name}: Scene to load is not set.");
        }

        if (hasError)
        {
            LogError();
        }
    }
    // public method
    public void ChangeScene()
    {
        if (hasError)
        {
            LogError();
            return;
        }

        StartCoroutine(StartTransition());
    }
    public string GetSceneToLoad()
    {
        return sceneToLoad;
    }
    //private methods
    private IEnumerator LoadScene(string sceneName, System.Action<bool> callback)
    {
        AsyncOperation loadOp = SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Additive);

        if (loadOp == null)
        {
            callback?.Invoke(false);
            yield break;
        }

        loadOp.allowSceneActivation = true;

        while (!loadOp.isDone) yield return null;

        callback?.Invoke(true);
    }
    public IEnumerator StartTransition()
    {
        string currentSceneName = SceneManager.GetActiveScene().name;

        if (currentSceneName == sceneToLoad)
        {
            Debug.LogWarning($"{GetType().Name}: Transiting to same scene transition canceled");
            yield break;
        }

        bool isTargetSceneLoaded = false;

        for (int i = 0; i < SceneManager.sceneCount; i++)
        {
            if (SceneManager.GetSceneAt(i).name == sceneToLoad)
            {
                isTargetSceneLoaded = true;
                Debug.Log($"{GetType().Name}: Target Scene already loaded");
                break;
            }
        }

        if (!isTargetSceneLoaded)
        {
            yield return StartCoroutine(LoadScene(sceneToLoad, (result) => isTargetSceneLoaded = result));
        }

        GetMainContainer(
            currentSceneName,
            currentSceneMainContainerTag,
            out RectTransform mainSceneContainer
        );
        GetMainContainer(
            sceneToLoad,
            nextSceneMainContainerTag,
            out RectTransform newSceneContainer
        );

        bool isOutDone = false;
        bool isInDone = false;

        OnTransitionStart?.Invoke();
        StartCoroutine(StartAnimation(true, currentSceneTransition, mainSceneContainer, () => isOutDone = true));
        StartCoroutine(StartAnimation(false, newSceneTransition, newSceneContainer, () => isInDone = true));

        yield return new WaitUntil(() => isOutDone && isInDone);

        if (unloadScene)
        {
            SceneManager.UnloadSceneAsync(currentSceneName);
        }

        Scene newScene = SceneManager.GetSceneByName(sceneToLoad);
        SceneManager.SetActiveScene(newScene);
        OnTransitionEnd?.Invoke(newScene);
    }
    private void GetMainContainer(string sceneName, string rectTransformTag, out RectTransform rt)
    {
        rt = null;
        GameObject[] roots = SceneManager.GetSceneByName(sceneName).GetRootGameObjects();

        foreach (GameObject root in roots)
        {
            GameObject found = FindTaggedChildRecursive(root.transform, rectTransformTag);
            if (found != null && found.TryGetComponent(out rt))
            {
                Debug.Log($"{GetType().Name}: Found RectTransform with tag '{rectTransformTag}' in {sceneName} --> {found.name}");
                return;
            }
        }
        Debug.LogWarning($"{GetType().Name}: RectTransform with tag '{rectTransformTag}' not found in {sceneName}");
    }
    private GameObject FindTaggedChildRecursive(Transform parent, string tagName)
    {
        if (parent.CompareTag(tagName))
        {
            return parent.gameObject;
        }

        foreach (Transform child in parent)
        {
            GameObject result = FindTaggedChildRecursive(child, tagName);
            if (result != null) return result;
        }
        return null;
    }
    private IEnumerator StartAnimation(bool isOut, TransitionType transition, RectTransform rt, System.Action callback)
    {
        if (rt is null)
        {
            callback?.Invoke();
            yield break;
        }

        GameObject root = rt.root.gameObject;
        if (!root.TryGetComponent(out CanvasGroup cg))
        {
            Debug.LogWarning($"{GetType().Name}: {root.gameObject.name} doesn't have Canvas Group component in its root");
        }
        else
        {
            cg.blocksRaycasts = false;
        }

        float passedTime = 0;

        switch (transition)
        {
            case TransitionType.None:
                break;

            case TransitionType.Fade:
                if (cg == null)
                {
                    break;
                }

                while (passedTime < slideDuration)
                {
                    passedTime += Time.deltaTime;
                    float progress = Mathf.Clamp01(passedTime / slideDuration);
                    float radian = progress * Mathf.PI / 2;
                    float value = Mathf.Sin(radian);
                    float delta = isOut ? 1 - value : value;
                    cg.alpha = delta;

                    yield return null;
                }

                cg.alpha = isOut ? 0 : 1;

                break;

            default:
                float width = cg.gameObject.GetComponent<RectTransform>().rect.width;

                Vector2 originalPos = rt.anchoredPosition;
                Vector2 offset = transition == TransitionType.SlideToLeft ? Vector2.right : Vector2.left;
                Vector2 startingPos = isOut ? originalPos : originalPos + offset * width;
                Vector2 finalPos = isOut ? originalPos + offset * width : originalPos;

                float moveRange = finalPos.x - startingPos.x;
                while (passedTime < slideDuration)
                {
                    passedTime += Time.deltaTime;
                    float progress = Mathf.Clamp01(passedTime / slideDuration);
                    float radian = progress * Mathf.PI / 2;
                    float delta = moveRange * Mathf.Sin(radian);

                    rt.anchoredPosition = new(startingPos.x + delta, startingPos.y);

                    yield return null;
                }

                rt.anchoredPosition = finalPos;
                break;
        }

        if (cg != null)
        {
            cg.blocksRaycasts = true;
        }

        callback?.Invoke();
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

            Debug.LogError($"{this.GetType().Name}: Error(s): caught...\n"
                           + message);
        }
    }
}