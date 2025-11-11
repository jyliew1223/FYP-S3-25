using NUnit.Framework.Constraints;
using System.Collections.Generic;
using System.Runtime.Serialization.Formatters;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class RouteSelector : MonoBehaviour
{
    [SerializeField] private GameObject buttonPrefab;
    [SerializeField] private Transform itemParent;
    [SerializeField] private ToggleButton toggle;

    public static RouteSelector Instance;
    public string selectedKey = "";
    private void Start()
    {
        if (Instance != null)
        {
            Destroy(Instance.gameObject);
        }
        Instance = this;
    }
    private void OnDestroy()
    {
        if (Instance == this)
        {
            Debug.Log($"{GetType().Name}: Destroying Instance");
            Instance = null;

            if (Instance != null)
            {
                Debug.LogError($"{GetType().Name}: Instance still not null after destroy: {Instance.gameObject.name}");
            }
        }
        else
        {
            Debug.Log($"{GetType().Name}: Destorying duplicates");
        }
    }
    private void OnEnable()
    {
        if (UnityReceiverManager.Instance == null || UnityReceiverManager.Instance.routes == null)
            return;

        foreach (Transform child in itemParent)
        {
            GameObject.Destroy(child.gameObject);
        }

        foreach (var item in UnityReceiverManager.Instance.routes)
        {
            Toggle togglebutton = Instantiate(buttonPrefab, itemParent).GetComponent<Toggle>();
            ToggleGroup toggleGroup = itemParent.GetComponent<ToggleGroup>();
            TextMeshProUGUI label = togglebutton.GetComponentInChildren<TextMeshProUGUI>();
            togglebutton.group = toggleGroup;
            label.text = item.Key;
            togglebutton.onValueChanged.AddListener((isOn) =>
            {
                item.Value.SetActive(isOn);
                if (toggle != null)
                    toggle.SetIsOn(false, true);
            });
        }
    }
}
