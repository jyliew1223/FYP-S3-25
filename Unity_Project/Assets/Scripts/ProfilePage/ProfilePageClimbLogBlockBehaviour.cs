using Newtonsoft.Json;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using static MonthlyRankingBlockBehaviour;

public class ProfilePageClimbLogBlockBehaviour : MonoBehaviour
{
    [SerializeField] private GameObject climbLogItemPrefab;
    [SerializeField] private Transform contentParentTransform;
    [SerializeField] private int itemToLoadPerRequest = 10;

    private List<ClimbLogData> climbLogDataList = new();
    private List<string> cachedClimdLogIds = new();

    private void Awake()
    {
        if (climbLogItemPrefab == null)
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
        await GetDataFromBackend(cachedClimdLogIds);
        GeneratePrefabs();
    }

    private class GetUserClimbLogsPayload : CustomWebRequest.WebRequestPayload
    {
        [JsonProperty("id_token")]
        public string IdToken { get; set; }
        [JsonProperty("count")]
        public int Count { get; set; }
        [JsonProperty("blacklist")]
        public List<string> Blacklist { get; set; }
    }
    private class GetUserClimbLogsResponse : CustomWebRequest.WebRequestResponse
    {
        [JsonProperty("data")]
        public List<ClimbLogData> Data { get; set; }
    }
    private async Task GetDataFromBackend(List<string> blacklist)
    {
        GetUserClimbLogsPayload payload = new()
        {
            IdToken = UserGlobalData.IDToken,
            Count = itemToLoadPerRequest,
            Blacklist = blacklist
        };

        string path = "get_user_climb_logs/";

        CustomWebRequest request = new(
            RequestMethod.POST,
            GlobalSetting.BaseUrl,
            path,
            payload
            );

        bool result = await request.SendRequest<GetUserClimbLogsPayload, GetUserClimbLogsResponse>();

        if (!result)
        {
            Debug.LogError($"{GetType().Name}: Web Request Failed:\n" +
                   $"{request.LogResponse<GetUserClimbLogsResponse>()}");
            return;
        }

        GetUserClimbLogsResponse response = request.Response as GetUserClimbLogsResponse;

        if (response == null || response.Data == null)
        {
            Debug.LogError($"{GetType().Name}: Response or Data is null." +
                   $"{request.LogResponse<GetUserClimbLogsResponse>()}");
            return;
        }

        Debug.Log($"{GetType().Name}: Web Request Succeeded:\n" +
                   $"{CustomWebRequest.LogResponse<GetUserClimbLogsResponse>(response)}");

        climbLogDataList = response.Data;
    }
    private void GeneratePrefabs()
    {
        if (climbLogItemPrefab == null || contentParentTransform == null)
        {
            Debug.LogError(
                $"{GetType().Name}: Cannot generate prefabs because " +
                "postItemPrefab or contentParentTransform is not assigned."
                );
            climbLogDataList.Clear(); // free memory
            return;
        }

        foreach(ClimbLogData climbLogData in climbLogDataList)
        {
            GameObject item = Instantiate(climbLogItemPrefab, contentParentTransform);
            ProfilePageClimbLogItemBehaviour itemBehaviour = item.GetComponent<ProfilePageClimbLogItemBehaviour>();

            if (itemBehaviour == null)
            {
                Debug.LogError(
                    $"{GetType().Name}: The instantiated prefab does not have a PostItemBehaviour component."
                    );
                Destroy(item);
                continue;
            }

            itemBehaviour.SetData(climbLogData);
            cachedClimdLogIds.Add(climbLogData.LogId);
        }
    }
}
