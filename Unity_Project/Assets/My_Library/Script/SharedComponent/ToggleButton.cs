using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;
using UnityEngine.Rendering;
using UnityEngine.UI;

public class ToggleButton : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
{
    [Header("Toggle Button Settings")]
    [SerializeField] private bool isOn = false;
    [SerializeField] private Image targetImage;
    [SerializeField] public UnityEvent<bool> OnToggleChange = new();

    [Header("Color Settings")]
    [SerializeField] private Color onColor = Color.green;
    [SerializeField] private Color offColor = Color.red;
    [SerializeField, Range(0f, 1f)] private float darkenFactor = 0.8f;

    public bool IsOn => isOn;

    private void OnValidate()
    {
        if (targetImage == null)
            return;
        UpdateButtonVisual();
    }
    void Start()
    {
        UpdateButtonVisual();
    }
    private void OnEnable()
    {
        UpdateButtonVisual();
        OnToggleChange?.Invoke(isOn);
    }
    public void OnPointerDown(PointerEventData eventData)
    {
        Color original = targetImage.color;
        targetImage.color = DarkenColor(original, darkenFactor);
    }
    public void OnPointerUp(PointerEventData eventData)
    {
        isOn = !isOn;
        OnToggleChange.Invoke(isOn);
        UpdateButtonVisual();
    }
    public void OnPointerExit(PointerEventData eventData)
    {
        UpdateButtonVisual();
    }
    private Color DarkenColor(Color color, float factor)
    {
        return new Color(color.r * factor, color.g * factor, color.b * factor, color.a);
    }

    private void UpdateButtonVisual()
    {
        if (isOn)
        {
            targetImage.color = onColor;
        }
        else
        {
            targetImage.color = offColor;
        }
    }
    public void SetIsOn(bool value, bool hasInvoke = false)
    {
        isOn = value;
        UpdateButtonVisual();
        if (hasInvoke)
            OnToggleChange?.Invoke(isOn);
    }
}
