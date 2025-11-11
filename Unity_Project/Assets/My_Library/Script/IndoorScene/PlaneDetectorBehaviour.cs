
using TMPro;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using Vuforia;

public class PlaneDetectorBehaviour : MonoBehaviour
{
    [Header("Vuforia Components")]
    [SerializeField] private GameObject planeFinder;

    [Header("UI Settings")]
    [SerializeField] private Button placeButton;

    [Header("Events")]
    [SerializeField] private UnityEvent<GameObject> OnObjectPlaced = new();
    public UnityEvent OnObjectRemoved = new();
    public bool IsGroundObjectPlaced { get; private set; } = false;
    public GameObject PlacedObject { get; private set; } = null;

    public static PlaneDetectorBehaviour Instance = null;

    private TextMeshProUGUI buttonText;
    private PlaneFinderBehaviour planeFinderBehaviour;
    private ContentPositioningBehaviour contentPositioningBehaviour;
    private bool isFound = false;

    private void Awake()
    {
        if (Instance != null)
        {
            Destroy(Instance.gameObject);
        }

        Instance = this;

        if (planeFinder == null)
        {
            Debug.LogError("PlaneFinder or PlaneStagePrefab is not assigned in the inspector.", this);
            return;
        }

        planeFinderBehaviour = planeFinder.GetComponent<PlaneFinderBehaviour>();
        contentPositioningBehaviour = planeFinder.GetComponent<ContentPositioningBehaviour>();

        buttonText = placeButton.GetComponentInChildren<TextMeshProUGUI>();
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
    private void Update()
    {
        if (placeButton != null)
        {
#if !UNITY_EDITOR
            placeButton.interactable = isFound && UnityReceiverManager.Instance.IsModelLoaded;
#endif
            if (UnityReceiverManager.Instance.IsModelLoaded)
            {
                buttonText.text = isFound ? "Place Object" : "Searching for Planes...";
            }
            else
            {
                buttonText.text = "Model not loaded...";
            }
        }
    }
    private void OnEnable()
    {
        if (planeFinderBehaviour != null)
        {
            planeFinderBehaviour.OnInteractiveHitTest.AddListener(OnInteractiveHitTest);
            planeFinderBehaviour.OnAutomaticHitTest.AddListener(OnAutomaticHitTest);
        }


        contentPositioningBehaviour.OnContentPlaced.AddListener((obj) =>
        {
            PlacedObject = obj;
            IsGroundObjectPlaced = true;
            OnObjectPlaced?.Invoke(PlacedObject);
        });

    }
    private void OnDisable()
    {
        if (planeFinderBehaviour != null)
        {
            planeFinderBehaviour.OnInteractiveHitTest.RemoveListener(OnInteractiveHitTest);
            planeFinderBehaviour.OnAutomaticHitTest.RemoveListener(OnAutomaticHitTest);

            contentPositioningBehaviour.OnContentPlaced.RemoveAllListeners();
        }
    }
    private void OnAutomaticHitTest(HitTestResult result)
    {
        isFound = result != null;
    }
    private void OnInteractiveHitTest(HitTestResult result)
    {
        Debug.Log("Placing object at: " + result.Position);
        contentPositioningBehaviour.PositionContentAtPlaneAnchor(result);
    }
    public void PlaceObject()
    {
#if !UNITY_EDITOR
        if (!isFound)
            return;
#endif
        if (planeFinderBehaviour != null)
        {
            Debug.Log("Performing Hit Test at screen center.", this);
            Vector2 screenCenter = new(Screen.width / 2f, Screen.height / 2f);
            planeFinderBehaviour.PerformHitTest(screenCenter);
        }
    }
    public void DropObject()
    {
        foreach (Renderer rend in PlacedObject.GetComponentsInChildren<Renderer>())
        {
            rend.enabled = false;
        }
        foreach (Collider coll in PlacedObject.GetComponentsInChildren<Collider>())
        {
            coll.enabled = false;
        }

        IsGroundObjectPlaced = false;
        PlacedObject = null;
        OnObjectRemoved?.Invoke();
    }
}
