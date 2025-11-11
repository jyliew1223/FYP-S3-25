using UnityEngine;
using Vuforia;

public class MidAirPlacerComponent : MonoBehaviour
{
    [SerializeField] private MidAirPositionerBehaviour positioner;
    [SerializeField] private ContentPositioningBehaviour contentpositioning;
    public void PlaceObject()
    {
        if (positioner != null)
        {
            Debug.Log($"{GetType().Name}: Placing Mid Air Stage.", this);
            Vector2 screenCenter = new(Screen.width / 2f, Screen.height / 2f);
            positioner.ConfirmAnchorPosition(screenCenter);
        }
    }
}
