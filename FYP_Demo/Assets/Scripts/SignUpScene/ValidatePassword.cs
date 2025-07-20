
using UnityEngine;

using System.Text.RegularExpressions;
using System.Linq;
using TMPro;

public class ValidatePassword : MonoBehaviour
{
    [SerializeField] private int minLength = 8;
    [Tooltip("Put -1 if doesn't want to limit")]
    [SerializeField] private int maxLength = -1;
    [SerializeField] private bool containBothNumberAndLetter = true;
    [SerializeField] private bool containBothUpperAndLowerCase = true;
    [SerializeField] private TMP_InputField confirmPasswordInputField;
    [SerializeField] private SignUpBtnBehaviour my_behaviour;

    private TMP_InputField passwordInputField;
    private bool isPasswordValid = true;
    private bool isValid = false;

    private void Start()
    {
        if (TryGetComponent<TMP_InputField>(out passwordInputField))
        {
            passwordInputField.onEndEdit.AddListener(CheckPassword);
        }
        else
        {
            Debug.LogError($"{this.GetType().Name}: TMP_InputField is not found in {gameObject.name}");
        }

        if (confirmPasswordInputField != null)
        {
            confirmPasswordInputField.onEndEdit.AddListener(ConfirmPassword);
        }
        else
        {
            Debug.LogWarning($"{this.GetType().Name}: Confirm Password Field not assigned");
        }
    }
    private void CheckPassword(string input)
    {
        isValid = false;
        confirmPasswordInputField.text = "";

        string cleanInput = input;
        TrimInput(ref cleanInput);

        if (cleanInput.Length < minLength)
        {
            Toast.Instance.ShowToast($"Password need to have at least {minLength} character");
            isPasswordValid = false;
        }

        if (cleanInput.Length > maxLength && maxLength > 0)
        {
            Toast.Instance.ShowToast($"Password cannot have more than {maxLength} character");
            isPasswordValid = false;
        }

        if (containBothNumberAndLetter)
        {
            bool hasLetter = cleanInput.Any(char.IsLetter);
            bool hasNumber = cleanInput.Any(char.IsDigit);

            if (!hasLetter || !hasNumber)
            {
                Toast.Instance.ShowToast($"Password need to have both digits and alphabets");
                isPasswordValid = false;
            }
        }

        if (containBothUpperAndLowerCase)
        {
            bool hasUpper = cleanInput.Any(char.IsUpper);
            bool hasLower = cleanInput.Any(char.IsLower);

            if (!hasUpper || !hasLower)
            {
                Toast.Instance.ShowToast($"Password need to have both uppercase and lowercase");
                isPasswordValid = false;
            }
        }

        if (isPasswordValid)
        {
            passwordInputField.text = cleanInput;
        }

        SendUpdate();
    }
    private void ConfirmPassword(string input)
    {
        isValid = true;
        string cleanInput = input;
        TrimInput(ref cleanInput);

        string password = passwordInputField.text.Trim();

        if (password != cleanInput)
        {
            isValid = false;
            Toast.Instance.ShowToast($"Password doesn't match");
        }

        SendUpdate();
    }
    private void SendUpdate()
    {
        my_behaviour.UpdateKeyValuePairs(gameObject.name, isValid && isPasswordValid);
    }
    private void TrimInput(ref string rawInput)
    {
        rawInput = rawInput.Trim();
        rawInput = Regex.Replace(rawInput, @"\s+", "");
    }
}
