using Unity.VisualScripting;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

public class LoginPanelBehaviour : MonoBehaviour
{
    [SerializeField] private RectTransform targetArea;

    private static LoginPanelBehaviour instance;

    private InputSystem_Actions inputSystem_Actions;
    void Awake()
    {
        if (instance != null && instance != this)
        {
            Debug.LogWarning($"{GetType().Name}: Instance already exists, destroying both!");
            Destroy(instance.gameObject);
            Destroy(this.gameObject);
            return;
        }

        instance = this;

        inputSystem_Actions = new();

        if (targetArea == null)
        {
            Debug.LogWarning($"{GetType().Name}: targetArea not set!");
        }
    }
    private void OnEnable()
    {
        inputSystem_Actions.UI.Click.performed += OnClickPerformed;
        inputSystem_Actions.Enable();
    }
    private void OnDisable()
    {
        if (inputSystem_Actions == null) return;

        inputSystem_Actions.UI.Click.performed -= OnClickPerformed;
        inputSystem_Actions.Disable();
    }
    private void OnDestroy()
    {
        if (instance == this)
        {
            instance = null;
        }
    }
    private void OnClickPerformed(InputAction.CallbackContext ctx)
    {
        Vector2 pointerPos = Vector2.zero;

        if (ctx.control.device is Pointer pointer)
        {
            pointerPos = pointer.position.ReadValue();
        }
        else if (ctx.control.device is Touchscreen)
        {
            pointerPos = Touchscreen.current.primaryTouch.position.ReadValue();
        }

        // Convert screen position to local position relative to the RectTransform
        Vector2 localPos = targetArea.InverseTransformPoint(pointerPos);

        // Check if pointer is inside the RectTransform
        if (!targetArea.rect.Contains(localPos))
        {
            Destroy(gameObject);
        }
    }
}
