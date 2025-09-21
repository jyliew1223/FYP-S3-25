using TMPro;
using UnityEngine.UI;
using UnityEngine;
using Newtonsoft.Json;
using System.IO;
using System.Threading.Tasks;
using System.Diagnostics.PerformanceData;

public class UserProfileBlockBehaviour : MonoBehaviour
{
    [SerializeField]
    private TextMeshProUGUI userNameTMPro;
    [SerializeField]
    private Image profileImage;

    private UserData userData;

    private void Start()
    {
        SetUp();
    }

    private class GetUserPayload : CustomWebRequest.WebRequestPayload
    {
        [JsonProperty("id_token")]
        public string IdToken { get; set; }
    }
    private class GetUserResponse : CustomWebRequest.WebRequestResponse
    {
        [JsonProperty("data")]
        public UserData Data { get; set; }
    }
    private async void SetUp()
    {
        if (UserGlobalData.IDToken != null)
        {
            await GetDataFromBackend();
        }
        else
        {
            Debug.LogWarning($"{GetType().Name}: No user have signed in");
        }

        if (userData != null)
        {
            UpdateData();
        }
        else
        {
            Debug.LogWarning($"{GetType().Name}: User is null after getting data");
        }
    }
    private async Task GetDataFromBackend()
    {
        GetUserPayload payload = new()
        {
            IdToken = UserGlobalData.IDToken,
        };

        string path = "get_user/";

        CustomWebRequest request = new(
            RequestMethod.POST,
            GlobalSetting.BaseUrl,
            path,
            payload
            );

        bool result = await request.SendRequest<GetUserPayload, GetUserResponse>();

        if (!result)
        {
            Debug.LogError($"{GetType().Name}: Web Request Failed:\n" +
                                $"{request.LogResponse<GetUserResponse>()}");
            return;
        }

        GetUserResponse response = request.Response as GetUserResponse;

        if (response == null || response.Data == null)
        {
            Debug.LogError($"{GetType().Name}: Response or Data is null." +
                   $"{request.LogResponse<GetUserResponse>()}");
            return;
        }

        Debug.Log($"{GetType().Name}: Web Request Succeeded:\n" +
                   $"{CustomWebRequest.LogResponse<GetUserResponse>(response)}");

        userData = response.Data;
    }

    private void UpdateData()
    {
        userNameTMPro.text = userData.FullName.ToString();
        profileImage.sprite = ImageHelper.GetErrorSprite();
    }
}
