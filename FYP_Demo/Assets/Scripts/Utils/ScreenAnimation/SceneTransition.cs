#if UNITY_EDITOR
using UnityEditor;
#endif

using UnityEngine;
using UnityEngine.SceneManagement;

using System.Linq;
using System.Collections;
using System.Collections.Generic;

public class SceneTransition : MonoBehaviour
{
    private enum TransitionType
    {
        SlideToLeft,
        SlideToRight,
    }

#if UNITY_EDITOR
    [SerializeField] private SceneAsset nextScene;
    private void OnValidate()
    {
        string path = AssetDatabase.GetAssetPath(nextScene);
        sceneToLoad = System.IO.Path.GetFileNameWithoutExtension(path);
    }
#endif

    [ReadOnly]
    [SerializeField] private string sceneToLoad;
    [Tag]
    [SerializeField] private string currentSceneCanvasTag = "MainContainer";
    [Tag]
    [SerializeField] private string nextSceneCanvasTag = "MainContainer";
    [SerializeField] private TransitionType transitionType = TransitionType.SlideToLeft;
    [SerializeField] float slideDuration = 1f;

    private RectTransform currentSceneCanvas;

    private bool hasError = false;
    private List<string> errorMessage = new();

    private void Start()
    {
        GameObject[] roots = SceneManager.GetActiveScene().GetRootGameObjects();

        foreach (GameObject root in roots)
        {
            foreach (GameObject child in root.transform)
            {
                if (child.CompareTag(currentSceneCanvasTag))
                {
                    if (!child.TryGetComponent<RectTransform>(out currentSceneCanvas))
                    {
                        Debug.LogWarning($"{this.GetType().Name}: GameObject with Tag '{currentSceneCanvasTag}' found --> {child.name}, but there is no Rect Transfrom component attach onto it");
                    }
                    else
                    {
                        Debug.Log($"{this.GetType().Name}: GameObject with Tag '{currentSceneCanvasTag}' found --> {child.name}\n" +
                            $"current Scene Canvas assigned");

                        break;
                    }
                }
            }

            if (currentSceneCanvas != null)
            {
                break;
            }
        }

        if (currentSceneCanvas == null)
        {
            hasError = true;
            string message = $"{this.GetType().Name}: current Scene Canvas not assigned!";
            errorMessage.Append(message);
            Debug.LogError(message);
        }
    }
    public void StartTransition()
    {
        if (hasError)
        {
            LogError();
            return;
        }

        if (sceneToLoad == SceneManager.GetActiveScene().name)
        {
            Debug.LogWarning($"{this.GetType().Name}: Loading same scene, operation canceled");
            return;
        }

        switch (transitionType)
        {
            case TransitionType.SlideToLeft:
                StartCoroutine(SlideToLeft());
                break;
            case TransitionType.SlideToRight:
                StartCoroutine(SlideToRight());
                break;
            default:
                StartCoroutine(SlideToLeft());
                break;
        }
    }
    private IEnumerator LoadNextScene(System.Action<RectTransform> onSceneLoaded)
    {
        AsyncOperation loadSceneAsync = SceneManager.LoadSceneAsync(sceneToLoad, LoadSceneMode.Additive);
        loadSceneAsync.allowSceneActivation = true;

        while (!loadSceneAsync.isDone) yield return null;

        Scene nextScene = SceneManager.GetSceneByName(sceneToLoad);
        GameObject[] roots = nextScene.GetRootGameObjects();
        RectTransform newSceneCanvas = null;

        foreach (GameObject root in roots)
        {
            foreach (Transform child in root.transform)
            {
                if (child.CompareTag("MasterContainer"))
                {
                    newSceneCanvas = child.GetComponent<RectTransform>();
                    break;
                }
            }

            if (newSceneCanvas != null)
                break;
        }

        onSceneLoaded?.Invoke(newSceneCanvas);
    }
    IEnumerator SlideToLeft()
    {
        float width = currentSceneCanvas.rect.width;

        Scene nextScene = SceneManager.GetSceneByName(sceneToLoad);
        RectTransform newSceneCanvas = null;

        StartCoroutine(LoadNextScene((canvas) =>
        {
            newSceneCanvas = canvas;
        }));

        if (newSceneCanvas != null)
        {
            float passedTime = 0f;

            Vector2 newSceneStartingPos = newSceneCanvas.anchoredPosition;
            Vector2 currentSceneStartingPos = currentSceneCanvas.anchoredPosition;
            newSceneCanvas.anchoredPosition = new Vector2(newSceneStartingPos.x + width, newSceneStartingPos.y);

            while (passedTime < slideDuration)
            {
                passedTime += Time.deltaTime;
                float progress = Mathf.Clamp01(passedTime / slideDuration);
                float degree = progress * 90f;
                float radian = degree * Mathf.Deg2Rad;
                float delta = width * Mathf.Sin(radian);

                currentSceneCanvas.anchoredPosition = currentSceneStartingPos + Vector2.left * delta;

                float newSceneDelta = (width - delta);
                newSceneCanvas.anchoredPosition = new Vector2(newSceneStartingPos.x + newSceneDelta, newSceneStartingPos.y);

                yield return null;
            }

            currentSceneCanvas.anchoredPosition = currentSceneStartingPos + Vector2.left * width;
            newSceneCanvas.anchoredPosition = newSceneStartingPos;
        }
        else
        {
            Debug.LogWarning($"{this.GetType().Name}: Master Container not found in {sceneToLoad}");
        }

        SceneManager.UnloadSceneAsync(SceneManager.GetActiveScene().name);
        SceneManager.SetActiveScene(nextScene);
    }

    IEnumerator SlideToRight()
    {
        float width = currentSceneCanvas.GetComponentInParent<RectTransform>().rect.width;

        AsyncOperation loadSceneAsync = SceneManager.LoadSceneAsync(sceneToLoad, LoadSceneMode.Additive);
        loadSceneAsync.allowSceneActivation = true;

        while (!loadSceneAsync.isDone) yield return null;

        Scene nextScene = SceneManager.GetSceneByName(sceneToLoad);
        GameObject[] roots = nextScene.GetRootGameObjects();
        RectTransform newSceneCanvas = null;

        foreach (GameObject root in roots)
        {
            Transform child = root.transform.Find("MasterContainer");
            if (child != null)
            {
                newSceneCanvas = child.GetComponent<RectTransform>();
                break;
            }
        }

        if (newSceneCanvas != null)
        {
            float passedTime = 0f;

            Vector2 newSceneStartingPos = newSceneCanvas.anchoredPosition;
            Vector2 currentSceneStartingPos = currentSceneCanvas.anchoredPosition;
            newSceneCanvas.anchoredPosition = new Vector2(newSceneStartingPos.x - width, newSceneStartingPos.y);

            while (passedTime < slideDuration)
            {
                passedTime += Time.deltaTime;
                float progress = Mathf.Clamp01(passedTime / slideDuration);
                float degree = progress * 90f;
                float radian = degree * Mathf.Deg2Rad;
                float delta = width * Mathf.Sin(radian);

                currentSceneCanvas.anchoredPosition = currentSceneStartingPos - Vector2.left * delta;

                float newSceneDelta = (width - delta);
                newSceneCanvas.anchoredPosition = new Vector2(newSceneStartingPos.x - newSceneDelta, newSceneStartingPos.y);

                yield return null;
            }

            currentSceneCanvas.anchoredPosition = currentSceneStartingPos + Vector2.left * width;
            newSceneCanvas.anchoredPosition = newSceneStartingPos;
        }
        else
        {
            Debug.LogWarning($"{this.GetType().Name}: Master Container not found in {sceneToLoad}");
        }

        SceneManager.UnloadSceneAsync(SceneManager.GetActiveScene().name);
        SceneManager.SetActiveScene(nextScene);
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
