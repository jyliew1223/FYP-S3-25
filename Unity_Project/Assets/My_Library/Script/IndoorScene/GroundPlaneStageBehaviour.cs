using System.Linq;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.EnhancedTouch;

public class GroundPlaneStageBehaviour : MonoBehaviour
{
    [SerializeField] private Canvas controlCanvas;
    [SerializeField] private float offset = 0.05f;
    [SerializeField] private UnityEvent onModelTap = new();

    private MeshCollider[] hitboxes;

    private void Awake()
    {
        controlCanvas.gameObject.SetActive(false);
        EnhancedTouchSupport.Enable();
    }
    private void Update()
    {
        foreach (var touch in UnityEngine.InputSystem.EnhancedTouch.Touch.activeTouches)
        {
            if (touch.phase == UnityEngine.InputSystem.TouchPhase.Began)
            {
                if (IsPointerOverUI(touch))
                    continue;

                Vector2 screenPos = touch.screenPosition;
                Ray ray = Camera.main.ScreenPointToRay(screenPos);

                Debug.DrawRay(ray.origin, ray.direction * 100, Color.blue);

                RaycastHit[] hits = Physics.RaycastAll(ray);

                if (hits.Length > 0)
                {
                    RaycastHit? matchedHit = hits
                        .Where(h => hitboxes.Contains(h.collider))
                        .OrderBy(h => h.distance)
                        .Cast<RaycastHit?>()
                        .FirstOrDefault();

                    if (matchedHit.HasValue)
                    {
                        Collider c = matchedHit.Value.collider;
                        Debug.Log("Tapped on " + c.gameObject.name);
                        HandleOnTap();
                    }
                }
            }
        }
    }
    private bool IsPointerOverUI(UnityEngine.InputSystem.EnhancedTouch.Touch touch)
    {
        return EventSystem.current != null && EventSystem.current.IsPointerOverGameObject(touch.touchId);
    }
    private void HandleOnTap()
    {
        onModelTap?.Invoke();
    }
    public void SetModelBound(GameObject obj)
    {
        hitboxes = obj.GetComponentsInChildren<MeshCollider>();
    }
}
