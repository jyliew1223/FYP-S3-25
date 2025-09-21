using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Xml;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ProfilePageClimbLogItemBehaviour : MonoBehaviour
{
    [SerializeField]
    private TextMeshProUGUI locationTMPro;
    [SerializeField]
    private TextMeshProUGUI notesTMPro;
    [SerializeField]
    private TextMeshProUGUI postDateTimeTMPro;
    [SerializeField]
    private GameObject postImageContainer;
    [SerializeField]
    private GameObject postImageItemParent;
    [SerializeField]
    private GameObject postImageItemPrefab;

    private ClimbLogData climbLogData = null;

    private void Awake()
    {
        if (
            locationTMPro == null ||
            notesTMPro == null ||
            postDateTimeTMPro == null ||
            postImageContainer == null ||
            postImageItemParent == null)
        {
            Debug.LogError($"{GetType().Name}: Missing one or more required references in the inspector on '{gameObject.name}'.");
            Destroy(gameObject);
        }
    }

    private void Start()
    {
        foreach (Transform child in postImageItemParent.transform)
        {
            Destroy(child.gameObject);
        }

        updateData();
    }
    public void SetData(ClimbLogData postData)
    {
        this.climbLogData = postData;
    }

    private void updateData()
    {
        if (climbLogData == null)
        {
            Debug.LogWarning($"{GetType().Name}: postData is null, Destyroing...");
            Destroy(gameObject);
        }

        locationTMPro.text = climbLogData.Crag.Name;
        notesTMPro.text = climbLogData.Notes == null? "":climbLogData.Notes;
        postDateTimeTMPro.text = climbLogData.CreatedAtLocal.ToString("g");

        postImageContainer.SetActive(false);
    }
}
