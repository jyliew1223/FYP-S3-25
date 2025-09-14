using UnityEngine;

public class MainSceneBehaviour : MonoBehaviour
{
    private void Awake()
    {
        PanelController.Instnace.gameObject.SetActive(true);
    }

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start() { }

    // Update is called once per frame
    void Update() { }
}
