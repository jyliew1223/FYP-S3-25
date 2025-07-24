
using UnityEngine;

public class SceneController : MonoBehaviour
{

    [SerializeField] private float minLoadTime;
    [SerializeField] private SceneTransition transition;

    [SerializeField] private GameObject errorCanvas;

    private bool hasError;

    void Start()
    {
        if (transition != null)
        {
            Invoke(nameof(ChangeScene), minLoadTime);
        }
        else
        {
            hasError = true;
            errorCanvas.SetActive(true);
        }
    }
    void ChangeScene()
    {
        if (hasError) return;
        transition.ChangeScene();
    }
}
