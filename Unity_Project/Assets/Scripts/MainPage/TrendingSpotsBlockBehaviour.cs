using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;

public class TrendingSpotsBlockBehaviour : MonoBehaviour
{
    [SerializeField]
    private GameObject trendingSpotItemPrefab;
    [SerializeField]
    private Transform contentParentTransform;
    [SerializeField]
    private int itemToLoad = 10;
    [SerializeField]
    private bool shouldGenerateEmptyItems = false;

    private List<TrendingCragData> data = new();

    private void Awake()
    {
        if (trendingSpotItemPrefab == null)
        {
            Debug.LogError(
                $"{GetType().Name}: TrendingSpotItemPrefab is not assigned in the inspector."
                );
        }
        if (contentParentTransform == null)
        {
            Debug.LogError(
                $"{GetType().Name}: ContentParentTransform is not assigned in the inspector."
                );
        }
    }

    private void Start()
    {
        foreach (Transform child in contentParentTransform)
        {
            Destroy(child.gameObject);
        }

        GetAndGenerateItem();
    }

    private async void GetAndGenerateItem()
    {
        await GetDataFromBackend();
        GeneratePrefabs();
    }

    private class GetTrendingSpotsPayload : CustomWebRequest.WebRequestPayload
    {
        [JsonProperty("count")]
        public int Count { get; set; }
    }
    private class TrendingCragData : CustomWebRequest.WebRequestResponseData
    {
        [JsonProperty("crag")]
        public CragData Crag { get; set; }

        [JsonProperty("current_count")]
        public int CurrentCount { get; set; }

        [JsonProperty("previous_count")]
        public int PreviousCount { get; set; }

        [JsonProperty("growth")]
        public float Growth { get; set; }

        [JsonProperty("growth_rate")]
        public float GrowthRate { get; set; }
    }
    private class GetTrendingSpotsResponse : CustomWebRequest.WebRequestResponse
    {
        [JsonProperty("data")]
        public List<TrendingCragData> Data { get; set; }
    }
    private async Task GetDataFromBackend()
    {
        string path = "get_trending_crags/";
        GetTrendingSpotsPayload payload = new()
        {
            Count = 10
        };

        CustomWebRequest request = new(
            RequestMethod.GET,
            GlobalSetting.BaseUrl,
            path,
            payload
            );

        bool result = await request.SendRequest<
            GetTrendingSpotsPayload,
            GetTrendingSpotsResponse
            >();

        if (!result)
        {
            Debug.LogError($"{GetType().Name}: Web Request Failed:\n" +
                   $"{request.LogResponse<GetTrendingSpotsResponse>()}");
            return;
        }

        GetTrendingSpotsResponse response = request.Response as GetTrendingSpotsResponse;

        if (response == null || response.Data == null)
        {
            Debug.LogError($"{GetType().Name}: Response or Data is null." +
                   $"{request.LogResponse<GetTrendingSpotsResponse>()}");
            return;
        }

        Debug.Log($"{GetType().Name}: Web Request Succeeded:\n" +
                   $"{CustomWebRequest.LogResponse<GetTrendingSpotsResponse>(response)}");

        data = response.Data;
    }

    private void GeneratePrefabs()
    {
        if (trendingSpotItemPrefab == null || contentParentTransform == null)
        {
            Debug.LogError(
                $"{GetType().Name}: Cannot generate prefabs because " +
                "trendingSpotItemPrefab or contentParentTransform is not assigned."
                );
            data.Clear(); // free memory
            return;
        }

        int itemsToGenerate = shouldGenerateEmptyItems ? itemToLoad : data.Count;

        for (int i = 0; i < itemsToGenerate; i++)
        {
            GameObject newItem = Instantiate(trendingSpotItemPrefab, contentParentTransform);
            TrendingSpotItemBehaviour itemBehaviour = newItem.GetComponent<TrendingSpotItemBehaviour>();

            if (itemBehaviour == null)
            {
                Debug.LogError(
                    $"{GetType().Name}: The prefab does not have a TrendingSpotItemBehaviour component."
                    );
                Destroy(newItem);
                continue;
            }

            if (i < data.Count)
            {
                itemBehaviour.SetData(data[i].Crag);
            }
            else
            {
                itemBehaviour.SetData(new CragData()
                {
                    Name = "N/A"
                });
            }
        }
        data.Clear(); // free memory
    }
}
