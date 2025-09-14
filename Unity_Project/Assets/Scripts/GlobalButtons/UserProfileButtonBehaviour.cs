using Unity.VisualScripting;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Button))]
public class UserProfileButtonBehaviour : MonoBehaviour
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

    private Button button;

    private void Awake()
    {
        if(!TryGetComponent(out button))
        {
            Debug.LogError($"No Button component found on {gameObject.name}.");
        }

        if(string.IsNullOrEmpty(nextScene))
        {
            Debug.LogWarning($"{GetType().Name}: nextscene not set on {gameObject.name}.");
        }
    }

    private void OnEnable()
    {
        button.onClick.AddListener(HandleOnClick);
    }

    private void OnDisable()
    {
        button.onClick.RemoveListener(HandleOnClick);
    }

    private void HandleOnClick()
    {
        if(!string.IsNullOrEmpty(nextScene))
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene(nextScene);
        }
        else
        {
            Debug.LogWarning($"{GetType().Name}: nextScene is null or empty on {gameObject.name}.");
        }
    }
}
