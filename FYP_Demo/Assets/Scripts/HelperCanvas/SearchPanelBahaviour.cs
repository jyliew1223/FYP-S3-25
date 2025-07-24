
using UnityEngine;
using UnityEngine.UI;
using TMPro;

using System.Collections;
using System.Collections.Generic;

[RequireComponent(typeof(RectTransform))]
public class SearchPanelBahaviour : MonoBehaviour
{
    [SerializeField] private TMP_InputField searchField;
    [SerializeField] private Button exitSearchButton;
    [SerializeField] private Button hamburgerButton;
    [SerializeField] private float transitionTime = .5f;

    private RectTransform rt;
    private Vector2 rtStartingSize;

    private bool isShown;

    // Runtime logic
    private void Awake()
    {
        TryGetComponent(out rt);
    }

    private void Start()
    {
        if (rt == null)
        {
            AppendError($"{GetType().Name}: RectTransform component not found in {gameObject.name}");
        }
        else
        {
            rtStartingSize = rt.sizeDelta;

            Vector2 size = rtStartingSize;
            size.y = 0;
            rt.sizeDelta = size;
        }
        if (hasError)
        {
            LogError();
        }
    }

    private void OnEnable()
    {
        searchField.onSelect.AddListener(HandleOnInputFieldSelected);
        HintContainerBehaviour.OnHintContainerClicked += HidePanel;
        exitSearchButton.onClick.AddListener(HidePanel);
    }
    private void OnDisable()
    {
        searchField.onSelect.AddListener(HandleOnInputFieldSelected);
        HintContainerBehaviour.OnHintContainerClicked -= HidePanel;
        exitSearchButton.onClick.RemoveListener(HidePanel);
    }
    // public methods
    public void ShowPanel()
    {
        if (hasError)
        {
            return;
        }

        if (isShown)
        {
            return;
        }

        StartCoroutine(ShowPanel(true));
    }

    public void HidePanel()
    {
        if (hasError)
        {
            return;
        }

        if (!isShown)
        {
            return;
        }

        StartCoroutine(ShowPanel(false));
    }
    // private methods
    private void HandleOnInputFieldSelected(string input)
    {
        ShowPanel();
    }
    private IEnumerator ShowPanel(bool isShowing)
    {
        hamburgerButton.gameObject.SetActive(!isShowing);
        exitSearchButton.gameObject.SetActive(isShowing);

        float passedTime = 0;
        Rect safeArea = Screen.safeArea;
        float height = safeArea.height;

        while (passedTime < transitionTime)
        {
            passedTime += Time.deltaTime;
            float progress = Mathf.Clamp01(passedTime / transitionTime);
            float degree = progress * 90;
            float radian = degree * Mathf.Deg2Rad;
            float easeValue = (isShowing ? Mathf.Sin(radian) : Mathf.Cos(radian));
            float delta = easeValue * height;

            rt.sizeDelta = new(rtStartingSize.x, delta);

            yield return null;
        }

        if (isShowing)
        {
            rt.sizeDelta = new Vector2(rtStartingSize.x, height);
            isShown = true;
        }
        else
        {
            rt.sizeDelta = rtStartingSize;
            isShown = false;
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
