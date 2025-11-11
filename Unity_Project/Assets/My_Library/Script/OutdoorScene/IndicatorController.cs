using Unity.IntegerTime;
using UnityEngine;

public class IndicatorController : MonoBehaviour
{
    [SerializeField] private GameObject midAirIndicator;
    [SerializeField] private float minDistance = 5.0f;

    private float distance = 0f;
    private void Start()
    {
        distance = minDistance;

#if !UNITY_EDITOR
        UnityReceiver.Instance.SendReadyMessage();
#endif
    }
    private void Update()
    {
        midAirIndicator.transform.localPosition = new(0, 0, distance);
    }
    public void ApplyDistance(float value)
    {
        distance = minDistance + value;
    }
}
