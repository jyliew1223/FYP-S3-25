using Unity.Collections;
using UnityEngine;
using UnityEngine.UI;

public class ModelWarpperBehaviour : MonoBehaviour
{

    [Header("Settings")]
    [SerializeField] private float scalingSpeed = 1f;
    [SerializeField] private float rotationSpeed = 50f;
    [SerializeField] private float translationSpeed = 0.1f;

    [Header("Controls")]
    [Header("Translation Buttons")]
    [SerializeField] private ClickAndHoldButton upButton;
    [SerializeField] private ClickAndHoldButton downButton;
    [SerializeField] private ClickAndHoldButton forwardButton;
    [SerializeField] private ClickAndHoldButton backwardButton;
    [SerializeField] private ClickAndHoldButton leftButton;
    [SerializeField] private ClickAndHoldButton rightButton;

    [Header("Rotation Buttons")]
    [SerializeField] private ClickAndHoldButton rotateClockwiseButton;
    [SerializeField] private ClickAndHoldButton rotateCounterClockwiseButton;

    [Header("Scale Buttons")]
    [SerializeField] private ClickAndHoldButton zoomInButton;
    [SerializeField] private ClickAndHoldButton zoomOutButton;

    [Header("Other Buttons")]
    [SerializeField] private ClickAndHoldButton resetButton;
    [SerializeField] private InfiniteWheel scalerAdjuster;

    private void Update()
    {
        if (upButton.isPressed)
        {
            ApplyTranslation(Vector3.up);
        }
        if (downButton.isPressed)
        {
            ApplyTranslation(Vector3.down);
        }
        if (forwardButton.isPressed)
        {
            ApplyTranslation(Vector3.forward);
        }
        if (backwardButton.isPressed)
        {
            ApplyTranslation(Vector3.back);
        }
        if (leftButton.isPressed)
        {
            ApplyTranslation(Vector3.left);
        }
        if (rightButton.isPressed)
        {
            ApplyTranslation(Vector3.right);
        }
        if (rotateClockwiseButton.isPressed)
        {
            ApplyRotation(true);
        }
        if (rotateCounterClockwiseButton.isPressed)
        {
            ApplyRotation(false);
        }
        if (zoomInButton.isPressed)
        {
            ApplyScale(true);
        }
        if (zoomOutButton.isPressed)
        {
            ApplyScale(false);
        }
        if (resetButton.isPressed)
        {
            ResetTransform();
        }
    }
    private void UpdateLineRenderInChildren()
    {
        RouteRenderer[] routeRenderers = GetComponentsInChildren<RouteRenderer>();
        foreach (var renderer in routeRenderers)
        {
            renderer.UpdateRouteVisual();
        }
    }
    private void ApplyScale(bool isZoomIn)
    {
        Vector3 scaleValue = Vector3.one * (scalingSpeed * scalerAdjuster.currentValue * Time.deltaTime);
        Vector3 newScale = isZoomIn
            ? transform.localScale + scaleValue
            : transform.localScale - scaleValue;

        float minScale = 0f;
        float maxScale = 10f;

        newScale.x = Mathf.Clamp(newScale.x, minScale, maxScale);
        newScale.y = Mathf.Clamp(newScale.y, minScale, maxScale);
        newScale.z = Mathf.Clamp(newScale.z, minScale, maxScale);

        transform.localScale = newScale;

        UpdateLineRenderInChildren();
    }

    private void ApplyRotation(bool isClockwise)
    {
        float rotationValue = rotationSpeed * Time.deltaTime;
        transform.Rotate(Vector3.up, isClockwise ? rotationValue : -rotationValue);
        UpdateLineRenderInChildren();
    }
    private void ApplyTranslation(Vector3 direction)
    {
        Camera cam = Camera.main;

        Ray ray = cam.ScreenPointToRay(new Vector3(Screen.width / 2f, Screen.height / 2f, 0f));

        Vector3 flatDir = ray.direction;
        flatDir.y = 0;
        flatDir.Normalize();

        Vector3 right = Vector3.Cross(Vector3.up, flatDir).normalized;
        Vector3 movement =
            right * direction.x +
            Vector3.up * direction.y +
            flatDir * direction.z;

        transform.Translate(Time.deltaTime * translationSpeed * movement, Space.World);

        UpdateLineRenderInChildren();
    }
    private void ResetTransform()
    {
        transform.SetLocalPositionAndRotation(Vector3.zero, Quaternion.identity);
        transform.localScale = Vector3.one;
        UpdateLineRenderInChildren();
    }
}