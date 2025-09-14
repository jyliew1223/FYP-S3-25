using UnityEngine;

public class ToastController : MonoBehaviour
{
    [SerializeField]
    private GameObject toastPrefab;

    public static ToastController Instance { get; private set; }

    private static GameObject instance;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
            return;
        }
        if (toastPrefab == null)
        {
            Debug.LogError($"{GetType().Name}: Toast prefab is not assigned.");
            Destroy(gameObject);
        }
    }

    private void Start()
    {
        DontDestroyOnLoad(gameObject);
    }

    public void ShowToast(string message, float showDuration = 2f, float fadeDuration = .5f)
    {
        if (instance == null)
        {
            instance = Instantiate(toastPrefab);
        }

        instance.GetComponent<Toast>().ShowToast(message, showDuration, fadeDuration);
    }
}
