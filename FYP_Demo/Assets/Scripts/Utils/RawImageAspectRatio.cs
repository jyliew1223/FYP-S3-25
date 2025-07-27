
#if UNITY_EDITOR
using UnityEditor;
#endif

using UnityEngine;
using UnityEngine.UI;
using System.Text;

[RequireComponent(typeof(RawImage))]
public class RawImageAspectRatio : MonoBehaviour
{
#if UNITY_EDITOR
    [SerializeField] private bool editorUpdate = false;
    private void OnValidate()
    {
        editorUpdate = false;

        if (!TryGetComponent(out rawImage))
            AppendError($"{GetType().Name}: RawImage component not found in {gameObject.name}");

        GameObject parentObject = transform.parent != null ? transform.parent.gameObject : null;
        if (parentObject != null && !parentObject.TryGetComponent(out parentFitter))
            AppendError($"{GetType().Name}: AspectRatioFitter component not found in {parentObject.name}");

        if (hasError)
            LogError();

        UpdateAspect();
    }
#endif

    private RawImage rawImage;
    private AspectRatioFitter parentFitter;

    // Runtime Logic
    private void Awake()
    {
        if (!TryGetComponent(out rawImage))
            AppendError($"{GetType().Name}: RawImage component not found in {gameObject.name}");

        GameObject parentObject = transform.parent != null ? transform.parent.gameObject : null;
        if (parentObject != null && !parentObject.TryGetComponent(out parentFitter))
            AppendError($"{GetType().Name}: AspectRatioFitter component not found in {parentObject.name}");

        if (hasError)
            LogError();
    }

    private void Start()
    {
        UpdateAspect();
    }

    private void UpdateAspect()
    {
        if (rawImage.texture == null)
            return;

        float width = rawImage.texture.width;
        float height = rawImage.texture.height;
        float ratio = width / height;

        if (parentFitter != null)
        {
            parentFitter.aspectMode = AspectRatioFitter.AspectMode.HeightControlsWidth;
            parentFitter.aspectRatio = ratio;
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
