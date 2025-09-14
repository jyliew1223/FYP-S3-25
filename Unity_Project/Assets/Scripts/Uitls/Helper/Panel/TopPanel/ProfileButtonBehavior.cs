using UnityEngine;
using UnityEngine.UI;

public class ProfileButtonBehavior : MonoBehaviour
{
#if UNITY_EDITOR
    [SerializeField]
    private UnityEditor.SceneAsset sceneToLoad;
    private void OnValidate()
    {
        if(sceneToLoad != null)
        {
            nextScene = sceneToLoad.name;
        }
    }
#endif

    [ReadOnly]
    [SerializeField]
    private string nextScene;
    [SerializeField]
    private GameObject loginPanel;

    private Button profileButton;

    private void Awake()
    {
        if (!TryGetComponent(out profileButton))
        {
            Debug.LogWarning($"{GetType().Name}: Button component not found!");
        }

        if (loginPanel == null)
        {
            Debug.LogWarning($"{GetType().Name}: loginPanel not set!");
        }

        if(string.IsNullOrEmpty(nextScene))
        {
            Debug.LogWarning($"{GetType().Name}: nextscene not set!");
        }
    }

    private void OnEnable()
    {
        profileButton.onClick.AddListener(HandleButtonOnClick);
    }

    private void OnDisable()
    {
        profileButton.onClick.RemoveAllListeners();
    }

    private void HandleButtonOnClick()
    {
        if (UserGlobalData.isLoggedIn)
        {
            if(!string.IsNullOrEmpty(nextScene))
            {
                UnityEngine.SceneManagement.SceneManager.LoadScene(nextScene);
            }
            else
            {
                Debug.LogWarning($"{GetType().Name}: nextscene is null or empty.");
            }
            return;
        }
        Transform parent = FindParentWithTag(transform, Tags.MainContainer);
        Instantiate(loginPanel, parent);
    }

    private Transform FindParentWithTag(Transform child, string tag)
    {
        Transform current = child.parent;
        while (current != null)
        {
            if (current.CompareTag(tag))
                return current;
            current = current.parent;
        }
        return null;
    }

    public void UpdateProfileImage()
    {
        Debug.Log($"{GetType().Name}: UpdateProfileImage called");
    }
}
