
using System;
using UnityEngine;
using UnityEngine.InputSystem.XInput;
using UnityEngine.UI;

[RequireComponent(typeof(RectTransform))]
[RequireComponent(typeof(Button))]
public class AutoExpand : MonoBehaviour
{
    [SerializeField] private RectTransform contentRectTransform;

    private RectTransform parentRT;
    private RectTransform rt;
    private Button btn;

    private float originalWidth, originalHeight;

    private bool isExpanded = false;

    private void Awake()
    {
        GameObject parent = transform.parent.gameObject;

        parent.TryGetComponent(out parentRT);
        TryGetComponent(out rt);
        TryGetComponent(out btn);
    }

    private void OnEnable()
    {
        btn.onClick.AddListener(OnClick);
    }

    private void Start()
    {
        originalHeight = rt.rect.height;
        originalWidth = rt.rect.width;
    }

    private void OnDisable()
    {
        btn.onClick.RemoveListener(OnClick);
    }

    private void OnClick()
    {
        Debug.Log("clicked");
        if (!isExpanded)
        {
            Expand();
        }
        else
        {
            Collapse();
        }
    }

    private void Expand()
    {
        if (contentRectTransform != null)
        {
            rt.sizeDelta = contentRectTransform.rect.size;
            isExpanded = true;
        }

        LayoutRebuilder.ForceRebuildLayoutImmediate(parentRT);
    }

    private void Collapse()
    {
        if (contentRectTransform != null)
        {
            rt.sizeDelta = new(originalWidth, originalHeight);
            isExpanded = false;
        }

        LayoutRebuilder.ForceRebuildLayoutImmediate(parentRT);
    }
}

