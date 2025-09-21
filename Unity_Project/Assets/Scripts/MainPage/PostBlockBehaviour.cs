using Newtonsoft.Json;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using static MonthlyRankingBlockBehaviour;

public class PostBlockBehaviour : MonoBehaviour
{
    [SerializeField] private GameObject postItemPrefab;
    [SerializeField] private Transform contentParentTransform;
    [SerializeField] private int itemToLoadPerRequest = 10;

    private List<PostData> postDataList = new();
    private List<string> cachedPostIds = new();

    private void Awake()
    {
        if (postItemPrefab == null)
        {
            Debug.LogError(
                $"{GetType().Name}: PostItemPrefab is not assigned in the inspector."
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
        await GetDataFromBackend(cachedPostIds);
        GeneratePrefabs();
    }

    private class GetRandomPostPayload : CustomWebRequest.WebRequestPayload
    {
        [JsonProperty("count")]
        public int Count { get; set; }
        [JsonProperty("blacklist")]
        public List<string> Blacklist { get; set; }
    }
    private class GetRandomPostResponse : CustomWebRequest.WebRequestResponse
    {
        [JsonProperty("data")]
        public List<PostData> Data { get; set; }
    }
    private async Task GetDataFromBackend(List<string> blacklist)
    {
        GetRandomPostPayload payload = new()
        {
            Count = itemToLoadPerRequest,
            Blacklist = blacklist
        };

        string path = "get_random_posts/";

        CustomWebRequest request = new(
            RequestMethod.POST,
            GlobalSetting.BaseUrl,
            path,
            payload
            );

        bool result = await request.SendRequest<GetRandomPostPayload, GetRandomPostResponse>();

        if (!result)
        {
            Debug.LogError($"{GetType().Name}: Web Request Failed:\n" +
                   $"{request.LogResponse<GetRandomPostResponse>()}");
            return;
        }

        GetRandomPostResponse response = request.Response as GetRandomPostResponse;

        if (response == null || response.Data == null)
        {
            Debug.LogError($"{GetType().Name}: Response or Data is null." +
                   $"{request.LogResponse<GetRandomPostResponse>()}");
            return;
        }

        Debug.Log($"{GetType().Name}: Web Request Succeeded:\n" +
                   $"{CustomWebRequest.LogResponse<GetRandomPostResponse>(response)}");

        postDataList = response.Data;
    }
    private void GeneratePrefabs()
    {
        if (postItemPrefab == null || contentParentTransform == null)
        {
            Debug.LogError(
                $"{GetType().Name}: Cannot generate prefabs because " +
                "postItemPrefab or contentParentTransform is not assigned."
                );
            postDataList.Clear(); // free memory
            return;
        }

        foreach(PostData postData in postDataList)
        {
            GameObject item = Instantiate(postItemPrefab, contentParentTransform);
            PostItemBehaviour itemBehaviour = item.GetComponent<PostItemBehaviour>();

            if (itemBehaviour == null)
            {
                Debug.LogError(
                    $"{GetType().Name}: The instantiated prefab does not have a PostItemBehaviour component."
                    );
                Destroy(item);
                continue;
            }

            itemBehaviour.SetData(postData);
            cachedPostIds.Add(postData.PostId);
        }
    }
}
