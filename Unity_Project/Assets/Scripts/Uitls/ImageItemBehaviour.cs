using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(AspectRatioFitter))]
public class ImageItemBehaviour : MonoBehaviour
{
    [SerializeField] private Image imageComponent;

    private AspectRatioFitter aspectRatioFitter;

    private Sprite sprite = null;
    private AspectRatioFitter.AspectMode aspectMode;

    private void Awake()
    {
        if (imageComponent == null)
        {
            Debug.LogError($"{GetType().Name}: Image component is not assigned in the inspector.");
        }
        aspectRatioFitter = GetComponent<AspectRatioFitter>();
    }

    private void Start()
    {
        UpdateImage();
    }

    public void SetImage(Sprite sprite, AspectRatioFitter.AspectMode aspectMode = AspectRatioFitter.AspectMode.HeightControlsWidth)
    {
        this.sprite = sprite;
        this.aspectMode = aspectMode;
    }

    private void UpdateImage()
    {
        Sprite targetSprite;
        if (sprite != null)
        {
            targetSprite = sprite;
        }
        else
        {
            Debug.LogWarning($"{GetType().Name}: Provided sprite is null. Using error sprite instead.", this);
            targetSprite = ImageHelper.GetErrorSprite();
        }

        if(targetSprite == null)
        {
            Debug.LogWarning($"{GetType().Name}: targetSprite is null...", this);
            return;
        }
        aspectRatioFitter.aspectMode = aspectMode;
        aspectRatioFitter.aspectRatio = (float)targetSprite.texture.width / targetSprite.texture.height;
        imageComponent.sprite = targetSprite;
    }
}
