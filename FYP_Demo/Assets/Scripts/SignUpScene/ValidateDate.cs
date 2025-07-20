
using UnityEngine;

using System;
using TMPro;

public class ValidateDate : MonoBehaviour
{
    [SerializeField] private TMP_InputField dayInputField;
    [SerializeField] private TMP_InputField monthInputField;
    [SerializeField] private TMP_InputField yearInputField;
    [SerializeField] private SignUpBtnBehaviour my_behaviour;

    private void Start()
    {
        if (dayInputField != null)
        {
            dayInputField.onEndEdit.AddListener(_ => ValidateFullDate());
        }
        else
        {
            Debug.LogError($"{this.GetType().Name}: Day Input Field not assigned!");
        }

        if (monthInputField != null)
        {
            monthInputField.onEndEdit.AddListener(_ => ValidateFullDate());
        }
        else
        {
            Debug.LogError($"{this.GetType().Name}: Month Input Field not assigned!");
        }

        if (yearInputField != null)
        {
            yearInputField.onEndEdit.AddListener(_ => ValidateFullDate());
        }
        else
        {
            Debug.LogError($"{this.GetType().Name}: Year Input Field not assigned!");
        }
    }
    private void ValidateFullDate()
    {
        bool isValid = true;

        string dayStr = dayInputField.text.Trim();
        string monthStr = monthInputField.text.Trim();
        string yearStr = yearInputField.text.Trim();

        if (string.IsNullOrEmpty(dayStr) || string.IsNullOrEmpty(monthStr) || string.IsNullOrEmpty(yearStr))
        {
            return;
        }

        if (!int.TryParse(dayStr, out int day) || !int.TryParse(monthStr, out int month) || !int.TryParse(yearStr, out int year))
        {
            Toast.Instance.ShowToast("Date contains invalid character");
            return;
        }

        bool validDate = DateTime.TryParse($"{year}-{month}-{day}", out _);

        if (!validDate)
        {
            isValid = false;
            Toast.Instance.ShowToast("Invalid date entered!");
        }

        dayInputField.text = dayStr;
        monthInputField.text = monthStr;
        yearInputField.text = yearStr;

        my_behaviour.UpdateKeyValuePairs(gameObject.name, isValid);
    }
}
