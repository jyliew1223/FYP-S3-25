using System.Collections;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class Toast : MonoBehaviour
{
    [SerializeField]
    private TextMeshProUGUI inputField;

    private CanvasGroup canvasGroup;

    void Awake()
    {
        TryGetComponent(out canvasGroup);
        if (canvasGroup == null)
        {
            Debug.LogError($"{GetType().Name}: CanvasGroup component is missing, destroying...");
            Destroy(gameObject);
            return;
        }

        if (inputField != null)
        {
            canvasGroup.alpha = 0f;
            canvasGroup.interactable = false;
            canvasGroup.blocksRaycasts = false;
        }
        else
        {
            Debug.LogError($"{GetType().Name}: Failed to initialize Toast, destroying...");
            Destroy(gameObject);
        }

        DontDestroyOnLoad(gameObject);
    }

    private IEnumerator FadeAndHide(float showDuration, float fadeDuration)
    {
        yield return new WaitForSeconds(showDuration);

        while (canvasGroup.alpha > 0f)
        {
            canvasGroup.alpha -= Time.deltaTime / fadeDuration;
            yield return null;
        }

        yield return new WaitForSeconds(.5f);

        Destroy(gameObject);
    }

    public void ShowToast(string message, float showDuration, float fadeDuration)
    {
        StopAllCoroutines();
        inputField.text = message;
        canvasGroup.alpha = 1f;
        StartCoroutine(FadeAndHide(showDuration, fadeDuration));
    }
}
