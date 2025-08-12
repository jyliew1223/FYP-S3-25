
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class ProgressBar : MonoBehaviour
{
    [SerializeField] private Image fill;
    [SerializeField] private readonly float speedMultiplier = .25f;

    private float speed = .01f;

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

    public void SetProgress(float progress)
    {
        StopAllCoroutines();

        progress = Mathf.Clamp01(progress);

        speed = ((progress / fill.fillAmount) * speedMultiplier) + .01f;

        StartCoroutine(To(progress));
    }

    IEnumerator To(float target)
    {
        if (fill.fillAmount > target)
        {
            fill.fillAmount = target;
            yield break;
        }

        while (fill.fillAmount < target)
        {
            float temp = fill.fillAmount;
            temp += speed * Time.deltaTime;
            fill.fillAmount = Mathf.Clamp01(temp);
            yield return null;
        }
    }
}
