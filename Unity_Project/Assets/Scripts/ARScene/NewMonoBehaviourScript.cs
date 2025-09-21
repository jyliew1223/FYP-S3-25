using UnityEngine;

public class NewMonoBehaviourScript : MonoBehaviour
{
    private void Start()
    {
        PanelController.Instance.gameObject.SetActive(false);        
    }
    private void OnDestroy()
    {

        PanelController.Instance.gameObject.SetActive(true);
    }
}
