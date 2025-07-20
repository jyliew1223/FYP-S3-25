
using UnityEngine;

using System.Collections;
using TMPro;

public class Toast : MonoBehaviour
{
    public static Toast Instance;

    private CanvasGroup cg;

    private void Awake()
    {
        Instance = this;
        transform.SetAsLastSibling();

        if (!gameObject.TryGetComponent<CanvasGroup>(out cg))
        {
            Debug.LogError($"{this.GetType().Name}: CanvasGroup Component not found in {gameObject.name}");
        }
        else
        {
            cg.alpha = 0f;
        }

        gameObject.SetActive(false);
    }

    public void ShowToast(string message, float duration = 2f)
    {
        StopAllCoroutines();

        TextMeshProUGUI toastText = GetComponentInChildren<TextMeshProUGUI>();
        toastText.text = message;

        gameObject.SetActive(true);
        cg.alpha = 1f;

        StartCoroutine(FadeAndHide(duration));
    }

    private IEnumerator FadeAndHide(float duration)
    {
        yield return new WaitForSeconds(duration);

        float fadeTime = 0.5f;
        while (cg.alpha > 0f)
        {
            cg.alpha -= Time.deltaTime / fadeTime;
            yield return null;
        }

        gameObject.SetActive(false);
    }
}
