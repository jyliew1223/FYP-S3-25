using UnityEngine;

public class RouterRendererFinder : MonoBehaviour
{
    public Canvas canvas;
    private void Awake()
    {
        canvas = GetComponentInChildren<Canvas>();
    }
}
