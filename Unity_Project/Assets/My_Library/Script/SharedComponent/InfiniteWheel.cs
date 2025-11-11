using TMPro;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;

public class InfiniteWheel : MonoBehaviour, IDragHandler, IPointerDownHandler
{
    [SerializeField] private RectTransform wheelVisual;
    [SerializeField] private TextMeshProUGUI valueDisplay;
    [SerializeField] private bool allowNegative = false;
    [SerializeField] private bool isVertical = true;
    [SerializeField] private float sensitivity = 0.1f;
    [SerializeField] private UnityEvent<float> onValueChanged;

    public float currentValue { get; private set; } = 0.1f;
    private float wheelVisualOffset = 0f;
    private float timeLapsed = 0f;
    private float textFadeoutTime = 1f;
    private Vector2 lastPointerPos;

    private void Update()
    {
        timeLapsed += Time.deltaTime;
        if (valueDisplay != null)
        {
            Color c = valueDisplay.color;
            c.a = Mathf.Clamp01(1f - (timeLapsed / textFadeoutTime));
            valueDisplay.color = c;
        }

        if (wheelVisual != null)
        {
            if (wheelVisualOffset > 120f)
                wheelVisualOffset -= 240f;
            else if (wheelVisualOffset < -120f)
                wheelVisualOffset += 240f;

            if (isVertical)
            {
                wheelVisual.anchoredPosition = new Vector2(
                wheelVisual.anchoredPosition.x,
                wheelVisualOffset
                );
            }
            else
            {
                wheelVisual.anchoredPosition = new Vector2(
                wheelVisualOffset,
                wheelVisual.anchoredPosition.y
                );
            }
        }
    }

    public void OnPointerDown(PointerEventData eventData)
    {
        lastPointerPos = eventData.position;
    }

    public void OnDrag(PointerEventData eventData)
    {
        timeLapsed = 0f;

        Vector2 delta = eventData.position - lastPointerPos;

        if (isVertical)
        {
            currentValue += delta.y * sensitivity * 0.1f * Time.deltaTime;
            wheelVisualOffset += delta.y;
        }
        else
        {
            currentValue -= delta.x * sensitivity * 0.1f * Time.deltaTime;
            wheelVisualOffset += delta.x;
        }

        if (!allowNegative && currentValue < 0.1f)
            currentValue = 0.1f;

        if (valueDisplay != null)
            valueDisplay.text = currentValue.ToString("F2");

        onValueChanged?.Invoke(currentValue);

        lastPointerPos = eventData.position;
    }
}