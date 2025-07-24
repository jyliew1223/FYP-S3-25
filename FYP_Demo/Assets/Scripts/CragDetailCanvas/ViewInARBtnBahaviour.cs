
using UnityEngine;
using UnityEngine.UI;

using System.Collections;
using System.Collections.Generic;

public class ViewInARBtnBahaviour : MonoBehaviour
{
    [SerializeField] private ARSceneFlowManager sceneFlowPrefabs;
    private Button button;

    // runtime logic
    private void Awake()
    {
        TryGetComponent(out button);
    }

    private void Start()
    {
        if (button == null)
        {
            AppendError($"{GetType().Name}: Button component not found in {gameObject.name}");
        }

        if (hasError)
        {
            LogError();
        }
    }
    private void OnEnable()
    {
        button.onClick.AddListener(HandleOnClick);
    }
    private void OnDisable()
    {
        button.onClick.RemoveAllListeners();
    }
    // private method
    private void HandleOnClick()
    {
        if (hasError) LogError();

        StartCoroutine(InstantiateSceneManger());
    }
    private IEnumerator InstantiateSceneManger()
    {
        ARSceneFlowManager sceneFlowManager = Instantiate(sceneFlowPrefabs);

        yield return null;
        
        sceneFlowManager.ChangeScene();
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
