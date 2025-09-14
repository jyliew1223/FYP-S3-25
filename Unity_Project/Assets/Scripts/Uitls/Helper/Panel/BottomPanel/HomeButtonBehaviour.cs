using System.Runtime.CompilerServices;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(UnityEngine.UI.Button))]
public class HomeButtonBehaviour : MonoBehaviour
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

    private Button homeButton;

    private void Awake()
    {
        if (!TryGetComponent(out homeButton))
        {
            Debug.LogWarning($"(GetType().Name): No Button component found!");
        }
    }

    private void OnEnable()
    {
        homeButton.onClick.AddListener(HandleOnClick);
    }

    private void OnDisable()
    {
        homeButton.onClick.RemoveListener(HandleOnClick);
    }

    private void HandleOnClick()
    {
        if (!string.IsNullOrEmpty(nextScene))
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene(nextScene);
        }
        else
        {
            Debug.LogWarning($"{GetType().Name}: nextScene is null or empty!");
        }
    }
}
