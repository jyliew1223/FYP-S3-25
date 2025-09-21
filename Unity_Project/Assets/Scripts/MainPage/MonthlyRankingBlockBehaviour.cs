using Newtonsoft.Json;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class MonthlyRankingBlockBehaviour : MonoBehaviour
{
    [SerializeField]
    private GameObject userMonthlyRankingItemPrefab;
    [SerializeField]
    private Transform contentParentTransform;
    [SerializeField]
    private Button seeFullListButton;
    [SerializeField]
    private int numberOfItemsToShow = 3;
    [SerializeField]
    private int numberOfItemsToFetch = 10;
    [SerializeField]
    private bool shouldGenerateEmptyItems = false;

    private TextMeshProUGUI buttonText;
    private List<MonthlyRankingUserData> monthlyRankingData = new();
    private bool isFullListShown = false;

    private void Awake()
    {
        if (userMonthlyRankingItemPrefab == null)
        {
            Debug.LogError(
                $"{GetType().Name}: UserRankingItemPrefab is not assigned in the inspector."
                );
        }
        if (contentParentTransform == null)
        {
            Debug.LogError(
                $"{GetType().Name}: ItemParentTransform is not assigned in the inspector."
                );
        }
        if (seeFullListButton == null)
        {
            Debug.LogError(
                $"{GetType().Name}: SeeFullListButton is not assigned in the inspector."
                );
        }
        else
        {
            buttonText = seeFullListButton.GetComponentInChildren<TextMeshProUGUI>();
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

    private void OnEnable()
    {
        seeFullListButton.onClick.AddListener(HandleOnClick);
    }

    private void OnDisable()
    {
        seeFullListButton.onClick.RemoveListener(HandleOnClick);

    }

    private async void GetAndGenerateItem()
    {
        await GetDataFromBackend(numberOfItemsToFetch);
        GeneratePrefabs();
    }

    private class GetMonthlyUserRankingPayload : CustomWebRequest.WebRequestPayload
    {
        [JsonProperty("count")]
        public int Count { get; set; }
    }
    private class MonthlyRankingUserData : CustomWebRequest.WebRequestResponseData
    {
        [JsonProperty("user")]
        public UserData User { get; set; }

        [JsonProperty("rank")]
        public int Rank { get; set; }

        [JsonProperty("total_routes")]
        public int TotalRoutes { get; set; }
    }
    private class GetMonthlyUserRankingResponse : CustomWebRequest.WebRequestResponse
    {
        [JsonProperty("data")]
        public List<MonthlyRankingUserData> Data { get; set; }
    }
    private async Task GetDataFromBackend(int count)
    {
        string path = "get_monthly_user_ranking/";
        GetMonthlyUserRankingPayload payload = new GetMonthlyUserRankingPayload
        {
            Count = count,
        };

        CustomWebRequest request = new(
            RequestMethod.GET,
            GlobalSetting.BaseUrl,
            path,
            payload
            );

        bool result = await request.SendRequest<
            GetMonthlyUserRankingPayload,
            GetMonthlyUserRankingResponse
            >();

        if (!result)
        {
            Debug.LogError($"{GetType().Name}: Web Request Failed:\n" +
                   $"{request.LogResponse<GetMonthlyUserRankingResponse>()}");
            return;
        }

        GetMonthlyUserRankingResponse response = request.Response as GetMonthlyUserRankingResponse;

        if (response == null || response.Data == null)
        {
            Debug.LogError($"{GetType().Name}: Response or Data is null." +
                   $"{request.LogResponse<GetMonthlyUserRankingResponse>()}");
            return;
        }

        Debug.Log($"{GetType().Name}: Web Request Succeeded:\n" +
                   $"{CustomWebRequest.LogResponse<GetMonthlyUserRankingResponse>(response)}");

        monthlyRankingData = response.Data;
    }

    private void GeneratePrefabs()
    {
        if (userMonthlyRankingItemPrefab == null || contentParentTransform == null)
        {
            Debug.LogError(
                $"{GetType().Name}: Cannot generate prefabs because " +
                "userMonthlyRankingItemPrefab or contentParentTransform is not assigned."
                );
            monthlyRankingData.Clear(); // free memory
            return;
        }

        int count = isFullListShown ? numberOfItemsToFetch : numberOfItemsToShow;

        for (int i = 0; i < count; i++)
        {
            GameObject newItem = Instantiate(
                userMonthlyRankingItemPrefab,
                contentParentTransform
                );
            MonthlyRankingItemBehaviour itemBehaviour = newItem.GetComponent<MonthlyRankingItemBehaviour>();

            if (itemBehaviour == null)
            {
                Debug.LogError(
                    $"{GetType().Name}: The prefab does not have a UserMonthlyRankingItemBehaviour component."
                    );
                Destroy(newItem);
                continue;
            }

            if (i < monthlyRankingData.Count)
            {
                MonthlyRankingUserData data = monthlyRankingData[i];
                itemBehaviour.SetData(
                    data.User,
                    data.Rank,
                    data.TotalRoutes
                    );
            }
            else
            {
                if (shouldGenerateEmptyItems)
                {
                    itemBehaviour.SetData(
                    new UserData()
                    {
                        FullName = "N/A"
                    },
                    0,
                    0
                    );
                }
                else
                {
                    Destroy(newItem);
                }
            ;
            }
        }
    }

    private void HandleOnClick()
    {
        isFullListShown = !isFullListShown;
        string buttonMessage = isFullListShown ? "Collapse" : "See Full List";

        Debug.Log(monthlyRankingData.Count);

        if (buttonText == null)
        {
            Debug.LogWarning($"{GetType().Name}: ButtonText is null");
        }
        else
        {
            buttonText.text = buttonMessage;
        }

        foreach (Transform child in contentParentTransform)
        {
            Destroy(child.gameObject);
        }
        GeneratePrefabs();
    }
}
