using System;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;

using System.Collections;

[RequireComponent(typeof(RawImage))]
public class GoogleMap : MonoBehaviour
{
    private RawImage myRawImage;

    private void Awake()
    {
        if (!TryGetComponent(out myRawImage))
        {
            Debug.LogError($"{GetType().Name}: RawImage Component not found in {gameObject.name}");
        }
    }

    private void Start()
    {
        if (myRawImage != null)
        {
            StartCoroutine(LoadMapImage());
        }
    }

    IEnumerator LoadMapImage()
    {
        string url =
            "https://maps.googleapis.com/maps/api/staticmap?center=1.3521,103.8198&zoom=14&size=512x512&key=YOUR_API_KEY";
        UnityWebRequest www = UnityWebRequestTexture.GetTexture(url);
        yield return www.SendWebRequest();
        if (!www.isNetworkError && !www.isHttpError)
        {
            Texture2D texture = DownloadHandlerTexture.GetContent(www);
            myRawImage.texture = texture;
        }
        else
        {
            Debug.LogError($"Failed to load map image: {www.error}");
        }
    }
}
