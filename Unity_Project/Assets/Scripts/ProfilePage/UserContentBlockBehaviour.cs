using UnityEngine;
using UnityEngine.UI;

public class UserContentBlockBehaviour : MonoBehaviour
{
    [SerializeField] private Button postButton;
    [SerializeField] private Button climbLogButton;
    [SerializeField] private GameObject postContainer;
    [SerializeField] private GameObject climbLogContainer;

    private bool isShowingPostContainer = true;

    private void Awake()
    {
        if (
            postContainer == null ||
            climbLogContainer == null ||
            postButton == null ||
            climbLogButton == null)
        {
            Debug.LogError($"{GetType().Name}: Missing one or more required references in the inspector on '{gameObject.name}'.");
            Destroy(gameObject);
        }
    }
    private void OnEnable()
    {
        postButton.onClick.AddListener(HandlePostButtonOnClick);
        climbLogButton.onClick.AddListener(HandleClimbLogButtonOnClick);
    }
    private void Start()
    {
        postContainer.SetActive(isShowingPostContainer);
        climbLogContainer.SetActive(!isShowingPostContainer);
    }
    private void OnDisable()
    {
        postButton.onClick.RemoveListener(HandlePostButtonOnClick);
        climbLogButton.onClick.RemoveListener(HandleClimbLogButtonOnClick);
    }
    private void HandlePostButtonOnClick()
    {
        isShowingPostContainer = true;
        postContainer.SetActive(isShowingPostContainer);
        climbLogContainer.SetActive(!isShowingPostContainer);
    }
    private void HandleClimbLogButtonOnClick()
    {
        isShowingPostContainer = false;
        postContainer.SetActive(isShowingPostContainer);
        climbLogContainer.SetActive(!isShowingPostContainer);
    }
}
