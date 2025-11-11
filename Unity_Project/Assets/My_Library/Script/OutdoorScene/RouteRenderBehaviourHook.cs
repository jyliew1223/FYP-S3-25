using NUnit.Framework;
using System.Collections.Generic;
using System.ComponentModel.Design;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class RouteRenderBehaviourHook : MonoBehaviour
{
    [SerializeField] private GameObject listParent;
    [SerializeField] private GameObject buttonPrefab;

    private RouteRenderer routeRenderer;
    private List<ButtonAnchorPair> anchorButtonMapList = new();
    private int childCount = 0;
    void Start()
    {
        routeRenderer = GetComponent<RouteRenderer>();
    }
    void Update()
    {
        if (routeRenderer != null)
        {
            routeRenderer.UpdateRouteVisual();
        }
        if (childCount != transform.childCount)
        {
            childCount = transform.childCount;
            UpdateList();
        }
    }
    void UpdateList()
    {
        if (listParent == null)
        {
            return;
        }

        foreach (Transform child in listParent.transform)
        {
            Destroy(child.gameObject);
        }

        int count = 0;

        foreach (Transform child in transform)
        {
            ToggleButton toggle = Instantiate(buttonPrefab, listParent.transform).GetComponent<ToggleButton>();
            TextMeshProUGUI TMP = toggle.GetComponentInChildren<TextMeshProUGUI>();
            TMP.text = $"{++count}";

            RouterRendererFinder routerRendererFinder = child.GetComponent<RouterRendererFinder>();
            Canvas canvas = routerRendererFinder.canvas;

            if (canvas == null)
            {
                canvas = routerRendererFinder.GetComponentInChildren<Canvas>();
            }

            anchorButtonMapList.Add(new(toggle, child, canvas));

            canvas.gameObject.SetActive(false);
            toggle.OnToggleChange.AddListener((_) => EnableAnchor(toggle));
        }
    }
    private void EnableAnchor(ToggleButton clickedButton)
    {
        foreach (var pair in anchorButtonMapList)
        {
            pair.SetCanvasActive(pair.button == clickedButton);
        }
    }
    public void ClearPoints()
    {
        foreach (Transform child in transform)
        {
            Destroy(child.gameObject);
        }
        anchorButtonMapList.Clear();
        UpdateList();
    }
}
