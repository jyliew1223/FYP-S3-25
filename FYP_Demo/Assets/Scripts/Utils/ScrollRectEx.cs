using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class ScrollRectEx : ScrollRect
{
    private bool routeToParent = false;
    private Vector2 startDragPos;
    private bool dragging = false;

    [SerializeField] private float dragThreshold = 10f;

    public override void OnInitializePotentialDrag(PointerEventData eventData)
    {
        base.OnInitializePotentialDrag(eventData);
        routeToParent = false;
        dragging = false;
        startDragPos = eventData.position;
    }

    public override void OnBeginDrag(PointerEventData eventData)
    {
        base.OnBeginDrag(eventData);

        if (!dragging)
        {
            Vector2 delta = eventData.position - startDragPos;

            if (horizontal && Mathf.Abs(delta.x) > dragThreshold && Mathf.Abs(delta.x) > Mathf.Abs(delta.y))
                routeToParent = false;
            else if (vertical && Mathf.Abs(delta.y) > dragThreshold && Mathf.Abs(delta.y) > Mathf.Abs(delta.x))
                routeToParent = false;
            else
                routeToParent = true;

            dragging = true;
        }

        if (routeToParent)
        {
            PassEventToParent(eventData, ExecuteEvents.beginDragHandler);
        }
    }

    public override void OnDrag(PointerEventData eventData)
    {
        if (routeToParent)
        {
            PassEventToParent(eventData, ExecuteEvents.dragHandler);
        }
        else
        {
            base.OnDrag(eventData);
        }
    }

    public override void OnEndDrag(PointerEventData eventData)
    {
        if (routeToParent)
        {
            PassEventToParent(eventData, ExecuteEvents.endDragHandler);
        }
        else
        {
            base.OnEndDrag(eventData);
        }

        dragging = false;
    }

    private void PassEventToParent<T>(PointerEventData data, ExecuteEvents.EventFunction<T> function) where T : IEventSystemHandler
    {
        Transform parent = transform.parent;
        while (parent != null)
        {
            var rect = parent.GetComponent<ScrollRect>();
            if (rect != null)
            {
                ExecuteEvents.Execute(parent.gameObject, data, function);
                break;
            }
            parent = parent.parent;
        }
    }
}
