using UnityEngine;
using UnityEngine.UI;

public class ProfileButtonBehavior : MonoBehaviour
{
    [SerializeField] private GameObject loginPanel;
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
        Transform parent = FindParentWithTag(transform, Tags.MainContainer);
        Instantiate(loginPanel, parent);
    }
    Transform FindParentWithTag(Transform child, string tag)
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
}
