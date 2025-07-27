
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;

using System.Collections;
using System.Collections.Generic;
using System.Text;

[RequireComponent(typeof(RectTransform))]
[RequireComponent(typeof(CanvasGroup))]
public class SidePanelBehaviour : MonoBehaviour
{
    [SerializeField] private float popUpTime = 2f;
    [SerializeField] private float offset = 100f;

    private Canvas canvas;
    private RectTransform panel;
    private CanvasGroup cg;

    private Vector2 startingPos;
    private bool isShown;

    // Runtime Logic
    private void Awake()
    {
        TryGetComponent(out panel);
        TryGetComponent(out cg);
    }
    private void Start()
    {
        GameObject root = transform.root.gameObject;
        canvas = root.GetComponent<Canvas>();

        if (canvas == null)
        {
            AppendError($"{GetType().Name}: No Canvas found in scene: {SceneManager.GetActiveScene().name}");
        }

        if (panel != null)
        {
            startingPos = panel.anchoredPosition;
        }
        else
        {
            AppendError($"{GetType().Name}: RectTransform component not found in {gameObject.name}");
        }

        if (cg == null)
        {
            AppendError($"{GetType().Name}: Canvas Group component not found in {gameObject.name}");
        }

        HideVisual(true);
    }
    private void OnEnable()
    {
        SceneTransition.OnTransitionStart += HandleOnTransitionStart;
        GlobalInputManager.Initialize();
        GlobalInputManager.InputSystem.UI.Click.performed += OnClickPerformed;
    }
    private void OnDisable()
    {
        SceneTransition.OnTransitionStart -= HandleOnTransitionStart;
        GlobalInputManager.InputSystem.UI.Click.performed -= OnClickPerformed;
    }
    //Public Methods
    public void ShowPanel(bool isShowing)
    {
        if (hasError)
        {
            LogError();
            return;
        }

        if ((isShown && isShowing) || (!isShown && !isShowing)) return;

        isShown = true;

        float width = panel.rect.width;
        panel.anchorMin = new Vector2(0, 0);
        panel.anchorMax = new Vector2(0, 1);

        StartCoroutine(StartAnimation(isShowing, width + offset));
    }
    public void ResetPosition()
    {
        if (hasError)
        {
            LogError();
            return;
        }

        HideVisual(true);
        panel.anchoredPosition = startingPos;
    }
    // Private Methods
    private void HandleOnTransitionStart()
    {
        ShowPanel(false);
    }
    private void OnClickPerformed(InputAction.CallbackContext context)
    {
        if (hasError)
        {
            LogError();
            return;
        }

        if (!isShown) return;

        Vector2 inputPos = Pointer.current.position.ReadValue();

        Camera cam = canvas.renderMode == RenderMode.ScreenSpaceOverlay ? null : canvas.worldCamera;

        bool isInside = RectTransformUtility.RectangleContainsScreenPoint(panel, inputPos, cam);

        if (!isInside)
        {
            ShowPanel(false);
        }
    }
    private IEnumerator StartAnimation(bool isShowing, float targetValue)
    {
        float passedTime = 0;
        Vector2 targetPos = new(startingPos.x + targetValue, startingPos.y);
        float delta = targetPos.x - startingPos.x;

        if (isShowing)
        {
            HideVisual(false);
        }

        while (passedTime < popUpTime)
        {
            passedTime += Time.deltaTime;

            float progress = passedTime / popUpTime;
            float radian = progress * 90f * Mathf.Deg2Rad;
            float easedProgress = (isShowing ? Mathf.Sin(radian) : Mathf.Cos(radian));

            float movement = easedProgress * delta;

            Vector2 newPosition = new(startingPos.x + movement, startingPos.y);

            panel.anchoredPosition = newPosition;

            yield return null;
        }

        panel.anchoredPosition = targetPos;

        if (!isShowing)
        {
            HideVisual(true);
        }

        isShown = isShowing;
    }
    private void HideVisual(bool hide)
    {
        if (hide)
        {
            cg.alpha = 0;
            cg.interactable = false;
            cg.blocksRaycasts = false;
        }
        else
        {
            cg.alpha = 1;
            cg.interactable = true;
            cg.blocksRaycasts = true;
        }
    }
    // Error Helper
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
        errorMessage.Clear();
    }
}
