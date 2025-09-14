using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Button))]
public class CragProfileButtonBehaviour : MonoBehaviour
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
        if (!TryGetComponent(out button))
        {
            Debug.LogWarning($"{GetType().Name}: Button component not found on {gameObject.name}");
        }

        if (string.IsNullOrEmpty(nextScene))
        {
            Debug.LogWarning($"{GetType().Name}: nextscene not set on {gameObject.name}");
        }
    }
    private void OnEnable()
    {
        button.onClick.AddListener(HandleButtonOnClick);
    }
    private void OnDisable()
    {
        button.onClick.RemoveAllListeners();
    }
    private void HandleButtonOnClick()
    {
        if (!string.IsNullOrEmpty(nextScene))
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene(nextScene);
        }
        else
        {
            Debug.LogWarning($"{GetType().Name}: nextScene is null or empty on {gameObject.name}.");
        }
    }
}
