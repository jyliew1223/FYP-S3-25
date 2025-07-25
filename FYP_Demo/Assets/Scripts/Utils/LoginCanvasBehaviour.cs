using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.Windows;

public class LoginCanvasBehaviour : MonoBehaviour
{
    [SerializeField] private RectTransform loginPanel;

    private Queue<CanvasGroup> canvasGroupRecorder = new();
    private Canvas canvas;
    private void Awake()
    {
        TryGetComponent(out canvas);
    }

    private void OnEnable()
    {
        GlobalInputManager.Initialize();
        GlobalInputManager.InputSystem.UI.Click.performed += OnClickPerformed;
    }
    private void Start()
    {
        if (loginPanel == null)
        {
            AppendError($"{GetType().Name}: RectTransform component not found in {gameObject.name}");
        }
        if (canvas == null)
        {
            AppendError($"{GetType().Name}: Canvas component not found in {gameObject.name}");
        }

        if (hasError) LogError();
    }
    private void OnDisable()
    {
        GlobalInputManager.InputSystem.UI.Click.performed -= OnClickPerformed;
    }
    public void SetCanvasGroupRecorder(Queue<CanvasGroup> queue)
    {
        canvasGroupRecorder = queue;
    }
    private void OnClickPerformed(InputAction.CallbackContext context)
    {
        if (hasError)
        {
            LogError();
            return;
        }

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
            cg.interactable = true;
            cg.blocksRaycasts = true;
        }
    }
    // Error Helper
    private bool hasError;
    private List<string> errorMessage = new();
    private void AppendError(string message)
    {
        hasError = true;
        errorMessage.Add(message);
        Debug.LogError(message);
    }
    private void LogError()
    {
        if (hasError && errorMessage.Count > 0)
        {
            string message = "";
            foreach (var error in errorMessage)
            {
                message += error + "\n";
            }

            Debug.LogError($"{GetType().Name}: Error(s): caught...\n"
                           + message);
        }
    }
}
