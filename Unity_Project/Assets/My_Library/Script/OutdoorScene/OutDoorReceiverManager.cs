using UnityEngine;

public class OutDoorReceiverManager : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        UnityReceiver.Instance.SendReadyMessage();
    }
    // Update is called once per frame
    void Update()
    {
        
    }
}
