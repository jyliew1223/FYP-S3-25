using UnityEngine;

public class MainSceneBehaviour : MonoBehaviour
{
    private void Awake()
    {
        PanelController.Instance.gameObject.SetActive(true);
    }
}
