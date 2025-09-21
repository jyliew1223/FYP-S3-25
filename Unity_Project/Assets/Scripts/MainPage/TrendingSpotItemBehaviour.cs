using NUnit.Framework;
using TMPro;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.Xml.Serialization;

[RequireComponent(typeof(Image))]
[RequireComponent(typeof(Button))]
[RequireComponent(typeof(AspectRatioFitter))]
public class TrendingSpotItemBehaviour : MonoBehaviour
{
#if UNITY_EDITOR
    [SerializeField]
    UnityEditor.SceneAsset sceneToLoad;
    private void OnValidate()
    {
        nextScene = sceneToLoad.name;
    }
#endif

    [SerializeField]
    private ImageItemBehaviour imageItem;
    [SerializeField]
    private TextMeshProUGUI titleText;

    [ReadOnly]
    [SerializeField]
    string nextScene;

    private AspectRatioFitter aspectRatioFitter;
    private Button button;

    private CragData cragData = null;

    private void Awake()
    {
        if (imageItem == null || titleText == null)
        {
            Debug.LogError($"{GetType().Name}: Missing one or more required references in the inspector on '{gameObject.name}'.");
            Destroy(gameObject);
        }

        button = GetComponent<Button>();
        aspectRatioFitter = GetComponent<AspectRatioFitter>();
    }
    private void OnEnable()
    {
        Debug.Log("Adding Listebnder");
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
    public void SetData(CragData cragData)
    {
        this.cragData = cragData;
    }
    private void UpdateData()
    {
        if (cragData == null)
        {
            Debug.LogWarning($"{GetType().Name}: cragData is null, Destyroing...");
            Destroy(gameObject);
        }
        titleText.text = cragData.Name;
        imageItem.SetImage(null, AspectRatioFitter.AspectMode.HeightControlsWidth);
    }

    private void HandleOnClick()
    {
        Debug.Log("Clicked");
        if (string.IsNullOrEmpty(nextScene))
        {
            Debug.LogWarning($"{GetType().Name}: sceneToLoad is not set in Inspector, canceling HandleOnClick() action");
            return;
        }

        SceneManager.LoadScene(nextScene);
    }
}
