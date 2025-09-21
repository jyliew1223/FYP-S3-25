using UnityEngine.UI;
using UnityEngine;
using System.Security.Cryptography;

[RequireComponent(typeof(Button))]
public class MonthlyRankingItemBehaviour : MonoBehaviour
{
#if UNITY_EDITOR
    [SerializeField] private UnityEditor.SceneAsset sceneToLoad;
    private void OnValidate()
    {
        if (sceneToLoad != null)
        {
            nextScene = sceneToLoad.name;
        }
    }
#endif
    [SerializeField] private TMPro.TextMeshProUGUI rankText;
    [SerializeField] private TMPro.TextMeshProUGUI userNameText;
    [SerializeField] private TMPro.TextMeshProUGUI routesText;

    [ReadOnly]
    [SerializeField] private string nextScene;

    private Button button;

    private UserData userData = null;
    private int rank;
    private int routes;

    private void Awake()
    {
        if (rankText == null || userNameText == null || routesText == null)
        {
            Debug.LogError($"{GetType().Name}: Missing one or more required references in the inspector on '{gameObject.name}'.");
            Destroy(gameObject);
        }

        if (string.IsNullOrEmpty(nextScene))
        {
            Debug.LogError($"{GetType().Name}: NextScene is not assigned in the inspector.");
        }
        button = GetComponent<Button>();
    }
    private void OnEnable()
    {
        button.onClick.AddListener(HandleOnClick);
    }
    private void Start()
    {
        UpdateData();
    }

    private void OnDisable()
    {
        button.onClick.RemoveListener(HandleOnClick);
    }
    public void SetData(UserData userData, int rank, int routes)
    {
        this.userData = userData;
        this.rank = rank;
        this.routes = routes;
    }
    public void UpdateData()
    {
        if (userData == null)
        {
            Debug.LogWarning($"{GetType().Name}: userData is null, Destyroing...");
            Destroy(gameObject);
        }

        rankText.text = rank.ToString();
        userNameText.text = userData.FullName;
        routesText.text = routes.ToString() + "Routes";
    }
    public void HandleOnClick()
    {
        if (!string.IsNullOrEmpty(nextScene))
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene(nextScene);
        }
        else
        {
            Debug.LogError($"{GetType().Name}: NextScene is not assigned in the inspector.");
        }
    }
}
