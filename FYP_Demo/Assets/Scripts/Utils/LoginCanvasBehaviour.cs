
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.InputSystem;

public class LoginCanvasBehaviour : MonoBehaviour
{
    [SerializeField] private RectTransform loginPanel;

    private Queue<CanvasGroup> canvasGroupRecorder = new();
    private Canvas canvas;

    // Runtime Logic
    private void Awake()
    {
        TryGetComponent(out canvas);
    }

    private void OnEnable()
    {
        if (GlobalInputManager.Instance == null)
            GlobalInputManager.Initialize();

        if (GlobalInputManager.InputSystem != null)
            GlobalInputManager.InputSystem.UI.Click.performed += OnClickPerformed;
    }

    private void Start()
    {
        if (loginPanel == null)
            AppendError($"{GetType().Name}: RectTransform component not found in {gameObject.name}");
        if (canvas == null)
            AppendError($"{GetType().Name}: Canvas component not found in {gameObject.name}");

        if (hasError) LogError();
    }

    private void OnDisable()
    {
        if (GlobalInputManager.InputSystem != null)
            GlobalInputManager.InputSystem.UI.Click.performed -= OnClickPerformed;
    }

    // Public Methods
    public void SetCanvasGroupRecorder(Queue<CanvasGroup> queue)
    {
        canvasGroupRecorder = queue;
    }

    // private Methods
    private void OnClickPerformed(InputAction.CallbackContext context)
    {
        if (hasError)
        {
            LogError();
            return;
        }

        if (canvas == null || loginPanel == null) return;

        Vector2 inputPos = Pointer.current.position.ReadValue();
        Camera cam = canvas.renderMode == RenderMode.ScreenSpaceOverlay ? null : canvas.worldCamera;

        bool isInside = RectTransformUtility.RectangleContainsScreenPoint(loginPanel, inputPos, cam);

        if (!isInside)
        {
            DestroyLoginCanvas();
        }
    }

    private void DestroyLoginCanvas()
    {
        EnableDisabledCanvas();
        Destroy(gameObject);
    }

    private void EnableDisabledCanvas()
    {
        while (canvasGroupRecorder.Count > 0)
        {
            CanvasGroup cg = canvasGroupRecorder.Dequeue();
            if (cg != null)
            {
                cg.interactable = true;
                cg.blocksRaycasts = true;
            }
        }
    }

    //Error Helper
    private bool hasError;
    private readonly StringBuilder errorMessage = new();
    private void AppendError(string message)
    {
        hasError = true;
        errorMessage.AppendLine(message);
        Debug.LogError(message);
    }

    private void LogError()
    {
        if (!hasError || errorMessage.Length == 0) return;

        Debug.LogError($"{GetType().Name}: Error(s) caught...\n{errorMessage}");
        hasError = false; // Reset error state
        errorMessage.Clear();
    }
}
