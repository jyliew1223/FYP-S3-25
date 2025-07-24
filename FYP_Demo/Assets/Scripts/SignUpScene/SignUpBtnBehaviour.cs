
using UnityEngine;
using UnityEngine.UI;

using System.Collections.Generic;

public class SignUpBtnBehaviour : MonoBehaviour
{
    [SerializeField] private List<GameObject> constrainedData;

    private Button button;
    private Dictionary<string, bool> isValid_dict = new();

    private void Start()
    {
        if (TryGetComponent<Button>(out button))
        {
            button.interactable = false;
        }
        else
        {
            Debug.LogError($"{this.GetType().Name}: Button component not found in {gameObject.name}");
        }

        foreach (GameObject go in constrainedData)
        {
            isValid_dict.Add(go.name, false);
        }
    }
    public void UpdateKeyValuePairs(string name, bool value)
    {
        isValid_dict[name] = value;

        bool isValid = true;

        foreach (KeyValuePair<string, bool> pair in isValid_dict)
        {
            isValid &= pair.Value;
            Debug.Log($"Isvalid: {isValid}, {pair.Key}: {pair.Value}");
        }

        if (isValid)
        {
            button.interactable = true;
        }
        else
        {
            button.interactable = false;
        }
    }
}
