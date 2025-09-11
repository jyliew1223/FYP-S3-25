using System.Collections;
using UnityEngine;

public class PanelController : MonoBehaviour
{
    [SerializeField] GameObject sidePanel;

    private static PanelController instance;

    public static PanelController Instnace
    {
        get
        {
            if (instance == null)
            {
                instance = FindFirstObjectByType<PanelController>();
                if (instance == null)
                {
                    Debug.LogError($"{nameof(PanelController)}: An instance of PanelController is needed in the scene, but there is none.");
                }
            }
            return instance;
        }
    }

    private void Awake()
    {
        if (instance == null)
        {
            instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Debug.LogWarning($"{GetType().Name}: Duplicate instance found. Destroying the new one.");
            Destroy(gameObject);
        }

        if (sidePanel != null)
        {
            sidePanel.SetActive(true);
        }
    }
}
