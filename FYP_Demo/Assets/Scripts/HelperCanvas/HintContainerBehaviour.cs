
using UnityEngine;
using UnityEngine.UI;

using System.Collections.Generic;

[RequireComponent(typeof(Button))]
[RequireComponent(typeof(SceneTransition))]
public class HintContainerBehaviour : MonoBehaviour
{
    public static event System.Action OnHintContainerClicked;

    private Button btn;
    private SceneTransition sceneTransition;

    // runtime logic
    private void Awake()
    {
        TryGetComponent(out btn);
        TryGetComponent(out sceneTransition);
    }

    private void Start()
    {
        if (btn == null)
        {
            AppendError($"{GetType().Name}: Button component not found in {gameObject.name}");
        }

        if (sceneTransition == null)
        {
            AppendError($"{GetType().Name}: Scene Transition Behaviour component not found in {gameObject.name}");
        }

        if (hasError)
        {
            LogError();
        }
    }

    private void OnEnable()
    {
        btn.onClick.AddListener(OnClick);
    }
    private void OnDisable()
    {
        btn.onClick.RemoveListener(OnClick);
    }
    // private method
    private void OnClick()
    {
        if (hasError)
        {
            LogError();
            return;
        }

        OnHintContainerClicked?.Invoke();

        sceneTransition.ChangeScene();
    }
    // Error Helper
    private bool hasError;
    private List<string> errorMessage = new();

    private void AppendError(string message)
    {
        hasError = true;
        errorMessage.Add(message);
        Debug.LogError(message);
    }
    private void LogError()
    {
        if (hasError && errorMessage.Count > 0)
        {
            string message = "";
            foreach (var error in errorMessage)
            {
                message += error + "\n";
            }

            Debug.LogError($"{GetType().Name}: Error(s): caught...\n"
                           + message);
        }
    }
}
