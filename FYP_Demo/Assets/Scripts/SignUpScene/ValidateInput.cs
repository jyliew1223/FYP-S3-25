using UnityEngine;

using System.Text.RegularExpressions;
using TMPro;

public class ValidateInput : MonoBehaviour
{
    [SerializeField] private string variableName = "";
    [SerializeField] private bool autoTrimSpace = true;
    [SerializeField] private bool allowSymbols = true;
    [SerializeField] private SignUpBtnBehaviour my_behaviour;

    private TMP_InputField usernameTextField;

    private void Start()
    {
        usernameTextField = GetComponent<TMP_InputField>();

        usernameTextField.onEndEdit.AddListener(CheckInput);
    }
    private void CheckInput(string userInput)
    {
        bool isValid = true;
        string cleanInput = userInput;

        if (autoTrimSpace)
        {
            TrimInput(ref cleanInput);
        }

        if (string.IsNullOrEmpty(cleanInput))
        {
            isValid = false;
            Toast.Instance.ShowToast($"{variableName} cannot be empty!");
        }
        else if (!allowSymbols && CheckSymbols(userInput))
        {
            isValid = false;
            Toast.Instance.ShowToast($"{variableName} cannot contain any symbols!");
        }

        usernameTextField.text = cleanInput;

        my_behaviour.UpdateKeyValuePairs(gameObject.name, isValid);
    }
    private void TrimInput(ref string rawInput)
    {
        rawInput = rawInput.Trim();
        rawInput = Regex.Replace(rawInput, @"\s+", "");
    }
    private bool CheckSymbols(string input)
    {
        return Regex.IsMatch(input, @"[^a-zA-Z0-9\s]");
    }
}
