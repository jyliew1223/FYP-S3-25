using Newtonsoft.Json;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using static MonthlyRankingBlockBehaviour;

public class ProfilePagePostBlockBehaviour : MonoBehaviour
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

    private class GetUserPostsPayload : CustomWebRequest.WebRequestPayload
    {
        [JsonProperty("id_token")]
        public string IdToken { get; set; }
        [JsonProperty("count")]
        public int Count { get; set; }
        [JsonProperty("blacklist")]
        public List<string> Blacklist { get; set; }
    }
    private class GetUserPostsResponse : CustomWebRequest.WebRequestResponse
    {
        [JsonProperty("data")]
        public List<PostData> Data { get; set; }
    }
    private async Task GetDataFromBackend(List<string> blacklist)
    {
        GetUserPostsPayload payload = new()
        {
            IdToken = UserGlobalData.IDToken,
            Count = itemToLoadPerRequest,
            Blacklist = blacklist
        };

        string path = "get_post_by_user_id/";

        CustomWebRequest request = new(
            RequestMethod.POST,
            GlobalSetting.BaseUrl,
            path,
            payload
            );

        bool result = await request.SendRequest<GetUserPostsPayload, GetUserPostsResponse>();

        if (!result)
        {
            Debug.LogError($"{GetType().Name}: Web Request Failed:\n" +
                   $"{request.LogResponse<GetUserPostsResponse>()}");
            return;
        }

        GetUserPostsResponse response = request.Response as GetUserPostsResponse;

        if (response == null || response.Data == null)
        {
            Debug.LogError($"{GetType().Name}: Response or Data is null." +
                   $"{request.LogResponse<GetUserPostsResponse>()}");
            return;
        }

        Debug.Log($"{GetType().Name}: Web Request Succeeded:\n" +
                   $"{CustomWebRequest.LogResponse<GetUserPostsResponse>(response)}");

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
            ProfilePagePostItemBehaviour itemBehaviour = item.GetComponent<ProfilePagePostItemBehaviour>();

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
