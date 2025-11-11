using UnityEngine;
using UnityEngine.SceneManagement;
using Newtonsoft.Json;
using JetBrains.Annotations;

public class UnityReceiver : MonoBehaviour
{
    [SerializeField] private GameObject debugWindow;
    public static UnityReceiver Instance { get; private set; }
    public string indoorSceneJson;
    private bool hasNotifiedReady = false;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(this.gameObject);
        }
        else
        {
            Instance = this;
            DontDestroyOnLoad(this.gameObject);
        }
    }
    private void OnDestroy()
    {
        if (Instance == this)
        {
            Debug.Log($"{GetType().Name}: Destroying Instance");
            Instance = null;

            if (Instance != null)
            {
                Debug.LogError($"{GetType().Name}: Instance still not null after destroy: {Instance.gameObject.name}");
            }
        }
        else
        {
            Debug.Log($"{GetType().Name}: Destorying duplicates");
        }
    }
    public void LoadOutdoorScene(string json)
    {
        SceneManager.LoadScene("OutdoorScene");
    }

    public void LoadIndoorScene(string json)
    {
        indoorSceneJson = json;
        SceneManager.LoadScene("IndoorScene");
    }
    public void EnableDebugWindow(string json)
    {
        if (debugWindow != null)
        {
            debugWindow.SetActive(true);
        }
    }
    public void SendMessageToRN(string message)
    {
        try
        {
            Debug.Log($"{GetType().Name}: Sending message to RN: {message}");

            using AndroidJavaClass jc = new("com.azesmwayreactnativeunity.ReactNativeUnityViewManager");
            jc.CallStatic("sendMessageToMobileApp", message);
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[UnityReceiver] Failed to send message to RN: {e.Message}");
        }
    }
    public void SendRouteDataToRN(object routeData)
    {
        try
        {
            string jsonString = JsonConvert.SerializeObject(routeData, JsonSettings.UnityFriendly);
            SendMessageToRN(jsonString);
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[UnityReceiver] Failed to serialize and send route data: {e.Message}");
        }
    }
    public void SendReadyMessage()
    {
        if (!hasNotifiedReady)
        {
            hasNotifiedReady = true;
            Debug.Log($"{GetType().Name}: Unity is ready, notifying React Native");

            // Send ready message to React Native directly
            SendMessageToRN("UNITY_READY");
        }
    }
    public void SendFailMessage()
    {
        if (!hasNotifiedReady)
        {
            hasNotifiedReady = true;
            Debug.Log($"{GetType().Name}: Unity failed, notifying React Native");

            // Send ready message to React Native directly
            SendMessageToRN("UNITY_FAIL");
        }
    }
    public void ClearScene(string json)
    {
        Debug.Log("[UnityReceiver] Clearing scene: " + json);

        indoorSceneJson = null;
        hasNotifiedReady = false;

        if (UnityReceiverManager.Instance != null)
        {
            Debug.Log($"{GetType().Name}: Destroying UnityReceiverManager Instance");
            Destroy(UnityReceiverManager.Instance);
        }

        if (PlaneDetectorBehaviour.Instance != null)
        {
            Debug.Log($"{GetType().Name}: Destroying PlaneDetectorBehaviour Instance");
            Destroy(PlaneDetectorBehaviour.Instance);
        }

        SceneManager.LoadScene(0);
    }
    void OnEnable()
    {
        Application.logMessageReceived += OnLogMessage;
    }

    void OnDisable()
    {
        Application.logMessageReceived -= OnLogMessage;
    }

    void OnLogMessage(string condition, string stackTrace, LogType type)
    {
        string message = $"[UNITY_DEBUG_LOG]{type}:{condition}";
#if !UNITY_EDITOR
        SendMessageToRN(message);
#endif
    }
}
