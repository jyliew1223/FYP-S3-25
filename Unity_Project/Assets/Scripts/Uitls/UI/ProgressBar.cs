
using UnityEngine;
using UnityEngine.UI;

public class ProgressBar : MonoBehaviour
{
    [SerializeField]
    private Image fill;

    [SerializeField, Range(0, 1)]
    private float speedMultiplier = 0.25f;

    public float Progress = 0f;

    private readonly float speed = 1f;

    void Start()
    {
        if (fill == null)
        {
            Debug.LogError("Fill image is not assigned.");
            return;
        }
        else
        {
            fill.fillAmount = 0.01f;
        }
    }

    void Update()
    {
        if (fill.fillAmount >= Progress)
        {
            fill.fillAmount = Progress;
        }
        else
        {
            float temp = fill.fillAmount;
            temp += speed * speedMultiplier * Time.deltaTime;
            fill.fillAmount = Mathf.Clamp01(temp);
        }
    }
}
