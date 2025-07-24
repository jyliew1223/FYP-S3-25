
#if UNITY_EDITOR
using TMPro;
using UnityEditor;
#endif
using UnityEngine;
using UnityEngine.SceneManagement;

using System.Collections.Generic;

[System.Serializable]
public class StringGameObjectPair
{
#if UNITY_EDITOR
    public SceneAsset Scene;

#endif
    [ReadOnly] public string SceneName;
    public GameObject Button;
}

public class HelperCanvasBehaviour : MonoBehaviour
{
    [SerializeField] private List<StringGameObjectPair> sceneToButtonList = new();

    private Dictionary<string, GameObject> sceneNameToButtonMap;

    private static HelperCanvasBehaviour instance;

#if UNITY_EDITOR
    private void OnValidate()
    {
        foreach (var pair in sceneToButtonList)
        {
            if (pair.Scene != null)
            {
                pair.SceneName = pair.Scene.name;
            }
        }
    }
#endif
    private void Awake()
    {
        sceneNameToButtonMap = new Dictionary<string, GameObject>();
        foreach (var pair in sceneToButtonList)
        {
            if (!sceneNameToButtonMap.ContainsKey(pair.SceneName))
                sceneNameToButtonMap[pair.SceneName] = pair.Button;
        }
    }
    private void OnEnable()
    {
        SceneTransition.OnTransitionEnd += HandleOnTransitionEnd;
    }
    private void Start()
    {
        if (instance != null && instance != this)
        {
            Destroy(gameObject);
            Debug.LogWarning($"{GetType().Name}: Multiple instance found destroying...");
            return;
        }

        instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void OnDisable()
    {
        SceneTransition.OnTransitionEnd -= HandleOnTransitionEnd;
    }

    private void HandleOnTransitionEnd(Scene newScene)
    {
        foreach (KeyValuePair<string, GameObject> pair in sceneNameToButtonMap)
        {
            string key = pair.Key;
            GameObject obj = pair.Value;

            obj.SetActive(key != newScene.name);
        }
    }
}
