using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.Jobs;
using UnityEngine.UI;


public class ButtonAnchorPair
{
    public ToggleButton button;
    public Transform anchor;
    public GameObject canvas;
    public ButtonAnchorPair(ToggleButton button, Transform anchor, Canvas canvas)
    {
        this.button = button;
        this.anchor = anchor;
        this.canvas = canvas.gameObject;
    }
    public void SetCanvasActive(bool isActive)
    {
        if (canvas == null) return;

        canvas.SetActive(isActive);
        button.SetIsOn(isActive);
    }
}
public class RaycastControllerBehaviour : MonoBehaviour
{
    [Header("Prefabs")]
    [SerializeField] private GameObject raycastPinPrefab;
    [SerializeField] private GameObject routePinPrefab;
    [SerializeField] private GameObject routeRendererPrefab;
    [SerializeField] private GameObject UIButton;

    [Header("Parents")]
    [SerializeField] private Transform UIParent;

    [Header("UI Elements")]
    [SerializeField] private Button pinButton;

    [Header("Runtime Controls")]
    [SerializeField] private bool isOn = true;
    [SerializeField] private UnityReceiverManager unityReceiverManager;

    private MeshCollider hitbox;
    private GameObject visualInstance;
    private bool isTargetHitThisFrame = false;
    private Transform savedPin = null;
    private List<ButtonAnchorPair> anchorButtonMapList = new();

    public bool hasPinnedAnchors => anchorButtonMapList.Count > 0;

    private void Awake()
    {
        visualInstance = Instantiate(raycastPinPrefab, Vector3.zero, Quaternion.identity, transform);
        visualInstance.SetActive(false);
    }
    void Update()
    {
        if (hitbox == null)
        {
            pinButton.interactable = false;
            return;
        }

        if (isOn)
        {
            float xAxis = Screen.safeArea.width / 2;
            float yAxis = Screen.safeArea.height / 2;
            Vector3 screenCenter = new(xAxis, yAxis, 0);
            Ray ray = Camera.main.ScreenPointToRay(screenCenter);

            Debug.DrawRay(ray.origin, ray.direction * 100, Color.red);

            RaycastHit[] hits = Physics.RaycastAll(ray);

            isTargetHitThisFrame = hits.Any(h => h.collider == hitbox);

            pinButton.interactable = isTargetHitThisFrame;

            if (isTargetHitThisFrame)
            {
                RaycastHit hit = hits.First(h => h.collider == hitbox);

                Debug.DrawRay(hit.point, hit.normal.normalized * 10, Color.green);

                visualInstance.SetActive(true);
                visualInstance.transform.SetPositionAndRotation(
                    Vector3.Lerp(visualInstance.transform.position, hit.point, 0.5f),
                    Quaternion.Slerp(visualInstance.transform.rotation, Quaternion.LookRotation(hit.normal), 0.5f)
                );
            }
        }
        else
        {
            visualInstance.SetActive(false);
        }
    }
    public void SetTargetHitBox(GameObject obj)
    {
        if (!PlaneDetectorBehaviour.Instance.IsGroundObjectPlaced)
        {
            Debug.Log($"{this.GetType().Name}: Placed object not placed");
            return;
        }
        if (obj == null)
        {
            Debug.LogError($"{this.GetType().Name}: Placed object is null");
            return;
        }
        this.hitbox = obj.GetComponentInChildren<MeshCollider>();
    }
    public void PinAnchor()
    {
        if (!isTargetHitThisFrame)
            return;

        if (savedPin == null)
        {
            savedPin = Instantiate(routeRendererPrefab, visualInstance.transform.position, visualInstance.transform.rotation, transform).transform;
            savedPin.transform.SetLocalPositionAndRotation(Vector3.zero, Quaternion.identity);
        }

        GameObject pinnedAnchor = Instantiate(routePinPrefab, visualInstance.transform.position, visualInstance.transform.rotation, savedPin);
        foreach (Transform child in pinnedAnchor.transform)
        {
            child.gameObject.SetActive(true);
        }
        Canvas canvas = pinnedAnchor.GetComponentInChildren<Canvas>();
        GameObject anchorButton = Instantiate(UIButton, UIParent);
        ToggleButton button = anchorButton.GetComponent<ToggleButton>();
        TextMeshProUGUI buttonText = anchorButton.GetComponentInChildren<TextMeshProUGUI>();

        if (buttonText != null)
        {
            buttonText.text = $"{anchorButtonMapList.Count + 1}";
        }

        button.OnToggleChange.AddListener((_) => EnableAnchor(button));

        ButtonAnchorPair pair = new(button, pinnedAnchor.transform, canvas);
        pair.SetCanvasActive(false);

        anchorButtonMapList.Add(pair);

        RouteRenderer routeRenderer = savedPin.GetComponent<RouteRenderer>();
        routeRenderer.UpdateRouteVisual();
    }
    public void SetIsOn(bool value)
    {
        isOn = value;

        if (isOn)
        {
            if (PlaneDetectorBehaviour.Instance == null)
            {
                Debug.LogError($"{this.GetType().Name}: PlaneDetectorBehaviour.Instance instance is null");
                return;
            }
            SetTargetHitBox(PlaneDetectorBehaviour.Instance.IsGroundObjectPlaced ? PlaneDetectorBehaviour.Instance.PlacedObject : null);
        }
    }
    public void ClearRoute()
    {
        foreach (var pair in anchorButtonMapList)
        {
            Destroy(pair.button.gameObject);
            Destroy(pair.anchor.gameObject);
        }
        anchorButtonMapList.Clear();

        StartCoroutine(ClearRouteCoroutine());
    }
    private IEnumerator ClearRouteCoroutine()
    {
        yield return null;
        RouteRenderer routeRenderer = savedPin.GetComponent<RouteRenderer>();
        routeRenderer.UpdateRouteVisual();
    }
    public void ExtractRoute()
    {
        List<Transform> pinnedAnchors = new();
        foreach (var pair in anchorButtonMapList)
        {
            pinnedAnchors.Add(pair.anchor);
        }
        unityReceiverManager.ExtractRouteData(pinnedAnchors, hitbox.bounds);
    }
    private void EnableAnchor(ToggleButton clickedButton)
    {
        foreach (var pair in anchorButtonMapList)
        {
            pair.SetCanvasActive(pair.button == clickedButton);
        }
    }
}
