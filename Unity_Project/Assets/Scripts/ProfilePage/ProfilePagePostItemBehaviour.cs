using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ProfilePagePostItemBehaviour : MonoBehaviour
{
    [SerializeField]
    private TextMeshProUGUI postTitleTMPro;
    [SerializeField]
    private TextMeshProUGUI postContentTMPro;
    [SerializeField]
    private TextMeshProUGUI postDateTimeTMPro;
    [SerializeField]
    private GameObject postImageContainer;
    [SerializeField]
    private GameObject postImageItemParent;
    [SerializeField]
    private GameObject postImageItemPrefab;

    private PostData postData = null;

    private void Awake()
    {
        if (
            postTitleTMPro == null ||
            postContentTMPro == null ||
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
    public void SetData(PostData postData)
    {
        this.postData = postData;
    }

    private void updateData()
    {
        if (postData == null)
        {
            Debug.LogWarning($"{GetType().Name}: postData is null, Destyroing...");
            Destroy(gameObject);
        }

        postTitleTMPro.text = "No Title";
        postContentTMPro.text = postData.Content;
        postDateTimeTMPro.text = postData.CreatedAtLocal.ToString("g");

        if (postData.ImageUrls == null || postData.ImageUrls.Count == 0)
        {
            postImageContainer.SetActive(false);
            return;
        }

        foreach (var sprite in postData.ImageUrls)
        {
            GameObject imageItem = Instantiate(postImageItemPrefab, postImageItemParent.transform);
            ImageItemBehaviour itemBehaviour = imageItem.GetComponent<ImageItemBehaviour>();
            
            if (itemBehaviour != null)
            {
                itemBehaviour.SetImage(null);
            }
            else
            {
                Debug.LogError($"{GetType().Name}: ImageItemBehaviour component is missing on the prefab '{postImageItemPrefab.name}'.");
            }
        }
    }
}
