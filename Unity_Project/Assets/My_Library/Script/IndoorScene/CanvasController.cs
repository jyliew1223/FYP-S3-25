using System.Collections;
using TMPro;
using UnityEngine;

public class CanvasController : MonoBehaviour
{
    [SerializeField] private GameObject placeButton;
    [SerializeField] private GameObject raycastControls;
    [SerializeField] private GameObject routePointControls;
    [SerializeField] private CanvasGroup messageCanvas;
    [SerializeField] private TextMeshProUGUI messageTMP;
    [SerializeField] private GameObject toggleControlButton;
    [SerializeField] private float fadeSpeed = .01f;
    [SerializeField] private GameObject creationParent;
    [SerializeField] private GameObject selectionParent;
    [SerializeField] private ToggleButton rayToggleButton;
    [SerializeField] private RaycastControllerBehaviour raycastControllerBehaviour;

    public bool isCreation = true;

    private GameObject routeParent;
    private void Start()
    {
        UpdateButtonState();
        ToggleControls();
    }
    private void OnEnable()
    {
        if (PlaneDetectorBehaviour.Instance == null)
            return;

        UpdateButtonState();
        ToggleControls();
    }
    public void UpdateButtonState()
    {
        bool state = PlaneDetectorBehaviour.Instance != null && PlaneDetectorBehaviour.Instance.IsGroundObjectPlaced;
        placeButton.SetActive(!state);
        raycastControls.SetActive(state);
        toggleControlButton.SetActive(state);

        bool isSaveAvailable = rayToggleButton.IsOn || raycastControllerBehaviour.hasPinnedAnchors;
        routePointControls.SetActive(isSaveAvailable);
        selectionParent.SetActive(!isCreation && state);
    }
    public void ShowMessage(string message)
    {
        StopAllCoroutines();
        messageTMP.text = message;
        messageCanvas.alpha = 1f;
        StartCoroutine(DisplayMessage());
    }
    private IEnumerator DisplayMessage()
    {
        float value = 1f;

        while (value > 0f)
        {
            messageCanvas.alpha = value;
            value -= fadeSpeed;
            yield return null;
        }

        messageCanvas.alpha = 0f;
    }
    public void ToggleControls()
    {
        isCreation = !isCreation;
        creationParent.SetActive(isCreation);
        selectionParent.SetActive(!isCreation && PlaneDetectorBehaviour.Instance.IsGroundObjectPlaced);

        foreach (var child in UnityReceiverManager.Instance.routes)
        {
            child.Value.SetActive(false);
        }
    }
}
