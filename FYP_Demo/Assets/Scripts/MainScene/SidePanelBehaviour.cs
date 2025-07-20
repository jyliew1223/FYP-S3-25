
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;

using System.Collections;

public class SidePanelBehaviour : MonoBehaviour
{
    [SerializeField] private float popUpTime = 2f;
    [SerializeField] private InputAction inputAction;

    private Canvas canvas;
    private RectTransform panel;
    private CanvasGroup cg;

    private Vector2 startingPos;
    private bool isShown = false;


    private void OnEnable()
    {
        inputAction.Enable();
        inputAction.performed += OnClickPerformed;
    }

    private void OnDisable()
    {
        inputAction.performed -= OnClickPerformed;
        inputAction.Disable();
    }
    private void OnDestroy()
    {
        inputAction.performed -= OnClickPerformed;
        inputAction.Disable();
    }
    private void Start()
    {
        GameObject root = transform.root.gameObject;
        canvas = root.GetComponent<Canvas>();

        if (canvas == null)
        {
            Debug.LogError($"{this.GetType().Name}: No Canvas found in scene: {SceneManager.GetActiveScene().name}");
        }

        if (TryGetComponent<RectTransform>(out panel))
        {
            startingPos = panel.anchoredPosition;
        }
        else
        {
            Debug.LogError($"{this.GetType().Name}: RectTransfrom component not found in {gameObject.name}");
        }

        if (!TryGetComponent<CanvasGroup>(out cg))
        {
            Debug.LogError($"{this.GetType().Name}: Canvas Group component not found in {gameObject.name}");
        }

        HideVisual(true);
    }
    private void OnClickPerformed(InputAction.CallbackContext context)
    {
        if (canvas == null)
        {
            Debug.LogError("canvas is null");
            return;
        }


        if (panel == null)
        {
            Debug.LogError("panel is null");
            return;
        }


        if (!isShown) return;

        Vector2 inputPos = Pointer.current.position.ReadValue();

        Camera cam = canvas.renderMode == RenderMode.ScreenSpaceOverlay ? null : canvas.worldCamera;

        bool isInside = RectTransformUtility.RectangleContainsScreenPoint(panel, inputPos, cam);

        if (!isInside)
        {
            HidePanel();
        }
    }
    public void ShowPanel()
    {
        if (isShown) return;

        isShown = true;

        float width = panel.rect.width;
        panel.anchorMin = new Vector2(0, 0);
        panel.anchorMax = new Vector2(0, 1);

        StartCoroutine(ShowAnimation(width / 2));
    }
    IEnumerator ShowAnimation(float targetValue)
    {
        float passedTime = 0;
        float delta = targetValue - startingPos.x;

        HideVisual(false);

        while (passedTime < popUpTime)
        {
            passedTime += Time.deltaTime;

            float progress = passedTime / popUpTime;
            float radian = progress * 90f * Mathf.Deg2Rad;
            float easedProgress = Mathf.Sin(radian);

            float movement = easedProgress * delta;

            Vector2 newPosition = new(startingPos.x + movement, startingPos.y);

            panel.anchoredPosition = newPosition;

            yield return null;
        }

        panel.anchoredPosition = new Vector2(targetValue, startingPos.y);
    }
    public void HidePanel()
    {
        if (!isShown) return;

        isShown = false;

        float width = panel.rect.width;
        panel.anchorMin = new Vector2(0, 0);
        panel.anchorMax = new Vector2(0, 1);

        StartCoroutine(HideAnimation(width / 2));
    }
    IEnumerator HideAnimation(float targetValue)
    {
        float passedTime = 0;
        float delta = targetValue - startingPos.x;

        while (passedTime < popUpTime)
        {
            passedTime += Time.deltaTime;

            float progress = passedTime / popUpTime;
            float radian = progress * 90f * Mathf.Deg2Rad;
            float easedProgress = Mathf.Cos(radian);

            float movement = easedProgress * delta;

            Vector2 newPosition = new(startingPos.x + movement, startingPos.y);

            panel.anchoredPosition = newPosition;

            yield return null;
        }

        panel.anchoredPosition = startingPos;

        HideVisual(true);
    }
    public void ResetPosition()
    {
        HideVisual(true);
        panel.anchoredPosition = startingPos;
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
}
