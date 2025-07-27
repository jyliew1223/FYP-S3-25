
using UnityEngine;

public class GlobalInputManager : MonoBehaviour
{
    public static GlobalInputManager Instance { get; private set; }

    public static InputSystem_Actions InputSystem;

    public static void Initialize()
    {
        if (Instance != null) return;

        GameObject go = new GameObject("GlobalInputManager");
        Instance = go.AddComponent<GlobalInputManager>();
        InputSystem = new();
        InputSystem.Enable();

        DontDestroyOnLoad(go);
    }

    private void OnDestroy()
    {
        if (Instance == this) Instance = null;
        InputSystem.Disable();
    }
}