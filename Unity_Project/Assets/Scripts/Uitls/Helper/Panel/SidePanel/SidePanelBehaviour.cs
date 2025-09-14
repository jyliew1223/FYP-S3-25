
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

public class SidePanelBehaviour : MonoBehaviour
{
    [SerializeField]
    private Button sidePanelButton;

    private InputSystem_Actions inputSystem_Actions;

    private void Awake()
    {
        if (sidePanelButton == null)
        {
            Debug.LogWarning($"{GetType().Name}: sidePanelButton not set!");
        }
        else
        {
            sidePanelButton.onClick.AddListener(ToggleSidePanel);
            Debug.Log($"{GetType().Name}: sidePanel is set.");
        }

        inputSystem_Actions = new();
    }

    private void Init()
    {
        if (UserGlobalData.isLoggedIn) { }
    }

    private void Start()
    {
        gameObject.SetActive(false);
    }

    private void OnEnable()
    {
        inputSystem_Actions.UI.Click.performed += OnClickPerformed;
        inputSystem_Actions.Enable();
    }

    private void OnDisable()
    {
        inputSystem_Actions.UI.Click.performed -= OnClickPerformed;
        inputSystem_Actions.Disable();
    }

    private void OnDestroy()
    {
        sidePanelButton.onClick.RemoveAllListeners();
    }

    private void OnClickPerformed(InputAction.CallbackContext ctx)
    {
        if (gameObject.activeSelf == false)
            return;

        Vector2 pointerPos = Vector2.zero;

        if (ctx.control.device is Pointer pointer)
            pointerPos = pointer.position.ReadValue();
        else if (ctx.control.device is Touchscreen)
            pointerPos = Touchscreen.current.primaryTouch.position.ReadValue();

        // Convert screen position to local position relative to the RectTransform
        RectTransform targetArea = transform as RectTransform;
        Vector2 localPos = targetArea.InverseTransformPoint(pointerPos);

        // Check if pointer is inside the RectTransform
        if (!targetArea.rect.Contains(localPos))
        {
            gameObject.SetActive(false);
        }
    }

    private void ToggleSidePanel()
    {
        gameObject.SetActive(!gameObject.activeSelf);
    }
}
