using System.Collections.Generic;
using System.Linq;
using Unity.VisualScripting;
using UnityEngine;

[RequireComponent(typeof(LineRenderer))]
public class RouteRenderer : MonoBehaviour
{
    private LineRenderer lineRenderer;
    private void Awake()
    {
        lineRenderer = GetComponent<LineRenderer>();
    }
    private void OnEnable()
    {
        UpdateRouteVisual();
    }
    public void UpdateRouteVisual()
    {
        List<Transform> routePoints = new();
        foreach (Transform child in transform)
        {
            routePoints.Add(child);
        }

        if (routePoints.Count <= 1)
        {
            lineRenderer.positionCount = 0;
            return;
        }

        lineRenderer.positionCount = routePoints.Count;
        for (int i = 0; i < routePoints.Count; i++)
        {
            lineRenderer.SetPosition(i, routePoints[i].position);
        }
    }
    public void CollectChild(GameObject go)
    {
        go.transform.parent = transform;
        if (!go.TryGetComponent<RouterRendererFinder>(out _))
        {
            go.AddComponent<RouterRendererFinder>();
        }
    }
}
