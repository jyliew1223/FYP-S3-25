using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;

public class GlobalEventSystem : MonoBehaviour
{
    private static GlobalEventSystem instance;

    void Awake()
    {
        if (instance != null && instance != this)
        {
            Destroy(gameObject);
            return;
        }

        instance = this;
        DontDestroyOnLoad(gameObject);

        SceneManager.sceneLoaded += OnSceneLoaded;
    }

    void OnDestroy()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
    }

    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        EventSystem[] systems = GameObject.FindObjectsByType<EventSystem>(FindObjectsSortMode.None);

        foreach (var sys in systems)
        {
            if (sys.gameObject != this.gameObject)
            {
                Debug.LogWarning($"[GlobalEventSystem] Destroying duplicate EventSystem in scene: {scene.name}");
                Destroy(sys.gameObject);
            }
        }
    }
}
