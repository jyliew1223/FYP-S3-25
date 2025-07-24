using UnityEngine;

[RequireComponent(typeof(RectTransform))]
public class SafeAreaAdjuster : MonoBehaviour
{
    [Range(0f, 1f)]
    [SerializeField] private float safeAreaMultiplier = .75f;
    private RectTransform panel;
    private Rect lastSafeArea;

    void Awake()
    {
        TryGetComponent(out panel);
        ApplySafeArea();
    }
    void ApplySafeArea()
    {
        Rect fullArea = new Rect(0, 0, Screen.width, Screen.height);
        Rect safeArea = Screen.safeArea;

        float offsetMinX = safeArea.xMin - fullArea.xMin;
        float offsetMinY = safeArea.yMin - fullArea.yMin;
        float offsetMaxX = fullArea.xMax - safeArea.xMax;
        float offsetMaxY = fullArea.yMax - safeArea.yMax;

        safeArea.xMin = fullArea.xMin + offsetMinX * safeAreaMultiplier;
        safeArea.yMin = fullArea.yMin + offsetMinY * safeAreaMultiplier;
        safeArea.xMax = fullArea.xMax - offsetMaxX * safeAreaMultiplier;
        safeArea.yMax = fullArea.yMax - offsetMaxY * safeAreaMultiplier;

        if (safeArea != lastSafeArea)
        {
            lastSafeArea = safeArea;

            Vector2 anchorMin = safeArea.position;
            Vector2 anchorMax = safeArea.position + safeArea.size;

            anchorMin.x /= Screen.width;
            anchorMin.y /= Screen.height;
            anchorMax.x /= Screen.width;
            anchorMax.y /= Screen.height;

            panel.anchorMin = anchorMin;
            panel.anchorMax = anchorMax;
        }
    }
}
