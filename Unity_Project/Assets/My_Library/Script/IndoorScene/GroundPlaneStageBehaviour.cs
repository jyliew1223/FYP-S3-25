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

    private MeshCollider hitbox;

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
                    RaycastHit hit = hits.OrderBy(h => h.distance).First();
                    if (hit.collider == hitbox)
                    {
                        Debug.Log("Tapped on " + hitbox.gameObject.name);
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
    private void OnDrawGizmos()
    {
        if (hitbox != null)
        {
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireCube(hitbox.bounds.center, hitbox.bounds.size + Vector3.one * offset);
        }
    }
    private void HandleOnTap()
    {
        onModelTap?.Invoke();
    }
    public void SetModelBound(GameObject obj)
    {
        hitbox = obj.GetComponentInChildren<MeshCollider>();
    }
}
