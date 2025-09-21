using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

[RequireComponent (typeof(Button))]
public class BackButtonBehaviour : MonoBehaviour
{
#if UNITY_EDITOR
    [SerializeField]
    private UnityEditor.SceneAsset sceneToLoad;

    private void OnValidate()
    {
        nextScene = sceneToLoad.name;
    }
#endif

    [ReadOnly]
    [SerializeField]
    private string nextScene;

    private Button button;

    private void Awake()
    {
        button = GetComponent<Button>();
    }

    private void HandleOnClick()
    {
        if(string.IsNullOrEmpty(nextScene))
        {
            Debug.LogWarning($"{GetType().Name}: sceneToLoad not set in inspector, canceling HandleOnClick() action...");
            return;
        }

        SceneManager.LoadScene(nextScene);
    }
}
