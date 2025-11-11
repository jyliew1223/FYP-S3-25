using UnityEngine;

public class AlwaysFacePlayerCanvas : MonoBehaviour
{
    private Transform playerCameraTransform;
    private void Start()
    {
        playerCameraTransform = Camera.main.transform;
    }
    private void LateUpdate()
    {
        Vector3 directionToCamera = playerCameraTransform.position - transform.position;
        directionToCamera.y = 0;
        if (directionToCamera.sqrMagnitude > 0.001f)
        {
            Quaternion targetRotation = Quaternion.LookRotation(directionToCamera);
            transform.rotation = targetRotation;
        }
    }
}
