using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(UnityEngine.UI.Button))]
public class LogoutButtonBehaviour : MonoBehaviour
{
#if UNITY_EDITOR
    [SerializeField]
    private UnityEditor.SceneAsset sceneToLoad;

    private void OnValidate()
    {
        if (sceneToLoad != null)
        {
            nextScene = sceneToLoad.name;
        }
    }

#endif

    [ReadOnly]
    [SerializeField]
    private string nextScene;

    private Button logoutButton;

    private void Awake()
    {
        if(!TryGetComponent(out logoutButton))
        {
            Debug.LogWarning($"(GetType().Name): No Button component found!");
        }

        if(string.IsNullOrEmpty(nextScene))
        {
            Debug.LogWarning($"{GetType().Name}: nextscene not set!");
        }
    }

    private void OnEnable()
    {
        logoutButton.onClick.AddListener(HandleOnClick);
    }

    private void OnDisable()
    {
        logoutButton.onClick.RemoveListener(HandleOnClick);
    }

    private void HandleOnClick()
    {
        UserGlobalData.SignOut();
        if (!string.IsNullOrEmpty(nextScene))
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene(nextScene);
        }
        else
        {
            Debug.LogWarning($"{GetType().Name}: nextscene is null or empty!");
        }
    }
}
