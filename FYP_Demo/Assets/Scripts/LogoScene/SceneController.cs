
using UnityEngine;

public class SceneController : MonoBehaviour
{

    [SerializeField] private float minLoadTime;
    [SerializeField] private SceneTransition transition;

    [SerializeField] private GameObject errorCanvas;

    void Start()
    {
        if (transition != null)
        {
            Invoke(nameof(ChangeScene), minLoadTime);
        }
        else
        {
            errorCanvas.SetActive(true);
        }
    }
    void ChangeScene()
    {
        transition.StartTransition();
    }
}
