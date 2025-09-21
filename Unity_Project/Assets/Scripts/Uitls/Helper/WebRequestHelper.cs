using Firebase.AppCheck;
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Permissions;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

public enum RequestMethod
{
    GET,
    POST,
    PUT,
    DELETE
}
public class CustomWebRequest
{
    public class WebRequestResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }
        [JsonProperty("message")]
        public string Message { get; set; }
        [JsonProperty("errors")]
        public object Errors { get; set; }
    }
    [Serializable]
    public class WebRequestResponseData { }
    [Serializable]
    public class WebRequestPayload { }

    public RequestMethod Method { get; }
    public string BaseUrl { get; }
    public string Path { get; }
    public WebRequestPayload Payload { get; }
    public bool AttachAppCheckToken { get; }
    public WebRequestResponse Response { get; private set; }

    private UnityWebRequest request;

    public CustomWebRequest(
        RequestMethod method,
        string baseUrl,
        string path,
        WebRequestPayload payload,
        bool attachAppCheckToken = true)
    {
        Method = method;
        BaseUrl = baseUrl;
        Path = path;
        Payload = payload;
        AttachAppCheckToken = attachAppCheckToken;
    }

    public async Task<bool> SendRequest<TPayload, TResponse>()
        where TPayload : WebRequestPayload
        where TResponse : WebRequestResponse
    {
        string url = $"{BaseUrl.TrimEnd('/')}/{Path.TrimStart('/')}";

        TPayload payload = Payload as TPayload;

        switch (Method)
        {
            case RequestMethod.GET:
                if (payload != null)
                {
                    url += ToQueryString(payload);
                }
                request = UnityWebRequest.Get(url);
                break;
            case RequestMethod.DELETE:
                request = UnityWebRequest.Delete(url);
                break;
            default:
                string jsonBody = payload != null ? JsonConvert.SerializeObject(payload) : "";
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);

                request = new UnityWebRequest(url, Method.ToString())
                {
                    uploadHandler = new UploadHandlerRaw(bodyRaw),
                    downloadHandler = new DownloadHandlerBuffer()
                };
                request.SetRequestHeader("Content-Type", "application/json");
                break;
        }

        if (AttachAppCheckToken)
        {
            try
            {
                AppCheckToken token = await FirebaseAppCheck.DefaultInstance.GetAppCheckTokenAsync(false);
                request.SetRequestHeader("X-Firebase-AppCheck", token.Token);
            }
            catch (Exception e)
            {
                Debug.LogError($"AppCheck token error: {e}");
                return false;
            }
        }

        using (request)
        {
            await request.SendWebRequest();

            string responseText = request.downloadHandler.text;

            try
            {
                Response = JsonConvert.DeserializeObject<TResponse>(responseText);

                if (request.result == UnityWebRequest.Result.Success)
                {
                    return true;
                }
                else
                {
                    Debug.LogError($"Request Failed:/n" +
                        $"{LogResponse(Response, request)}");
                    return false;
                }
            }
            catch (JsonException ex)
            {
                Debug.LogError($"Failed to parse JSON: {ex.Message}\n" +
                    "Raw response: " + responseText);
                return false;
            }
        }
    }

    public static string ToQueryString(object obj)
    {
        if (obj == null) return "";

        var properties = obj.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance);

        var queryParts = new List<string>();

        foreach (var prop in properties)
        {
            var value = prop.GetValue(obj, null);
            if (value == null) continue;

            // Check for JsonProperty attribute
            var jsonProp = prop.GetCustomAttribute<JsonPropertyAttribute>();
            string name = jsonProp != null ? jsonProp.PropertyName : prop.Name;

            queryParts.Add($"{Uri.EscapeDataString(name)}={Uri.EscapeDataString(value.ToString())}");
        }

        return queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "";
    }

    public static string LogResponse<T>(T response, UnityWebRequest request = null, string prefix = "")
        where T : WebRequestResponse
    {
        if (response == null)
        {
            return $"{prefix}: Response is null.";
        }

        if (String.IsNullOrEmpty(prefix))
        {
            prefix = typeof(T).Name;
        }

        StringBuilder sb = new();

        sb.AppendLine($"{prefix}: Response:");

        if (request != null)
        {
            sb.AppendLine($"\tStatusCode : {request.responseCode}");
        }

        sb.AppendLine($"\tSuccess\t : {response.Success}");
        sb.AppendLine($"\tMessage\t : {response.Message ?? "No message"}");

        // Print all child-specific properties
        var baseProperties = typeof(WebRequestResponse).GetProperties().Select(p => p.Name).ToHashSet();
        var childProperties = typeof(T)
            .GetProperties()
            .Where(p => !baseProperties.Contains(p.Name));

        foreach (var prop in childProperties)
        {
            var value = prop.GetValue(response);

            if (value is System.Collections.IEnumerable enumerable && value is not string)
            {
                sb.AppendLine($"\t{prop.Name}\t :[");
                foreach (var item in enumerable)
                {
                    sb.AppendLine($"    {JsonConvert.SerializeObject(item, Formatting.Indented)},");
                }
                sb.AppendLine("  ]");
            }
            else
            {
                sb.AppendLine(
                    $"  {prop.Name}: {JsonConvert.SerializeObject(value, Formatting.Indented)}"
                );
            }
        }

        // Handle errors
        if (response.Errors != null)
        {
            sb.AppendLine("\tErrors\t :");
            if (response.Errors is string s)
            {
                string responseString = response.Errors as string;
                sb.AppendLine($"\t  {s}");
            }
            else if (response.Errors is System.Collections.IDictionary dict)
            {
                foreach (System.Collections.DictionaryEntry entry in dict)
                {
                    sb.AppendLine($"\t  {entry.Key}: {JsonConvert.SerializeObject(entry.Value, Formatting.Indented)}");
                }
            }
            else
            {
                sb.AppendLine($"\t  {JsonConvert.SerializeObject(response.Errors, Formatting.Indented)}");
            }
        }
        else
        {
            sb.AppendLine("\tErrors\t : No errors");
        }

        return sb.ToString();
    }

    public string LogResponse<TResponse>(string prefix = "")
      where TResponse : WebRequestResponse
    {
        TResponse response = Response as TResponse;

        if (response == null)
        {
            return $"{prefix}: Response is null.";
        }

        if (String.IsNullOrEmpty(prefix))
        {
            prefix = typeof(TResponse).Name;
        }

        StringBuilder sb = new();

        if (!string.IsNullOrEmpty(prefix))
        {
            sb.AppendLine($"{prefix}: Response:");
        }

        if (request != null)
        {
            sb.AppendLine($"\tStatusCode : {request.responseCode}");
        }

        sb.AppendLine($"\tSuccess\t : {response.Success}");
        sb.AppendLine($"\tMessage\t : {response.Message ?? "No message"}");

        // Print all child-specific properties
        var baseProperties = typeof(WebRequestResponse).GetProperties().Select(p => p.Name).ToHashSet();

        var childProperties = typeof(TResponse)
            .GetProperties()
            .Where(p => !baseProperties.Contains(p.Name));

        foreach (var prop in childProperties)
        {
            var value = prop.GetValue(response);

            if (value is System.Collections.IEnumerable enumerable && value is not string)
            {
                sb.AppendLine($"  {prop.Name}:");
                foreach (var item in enumerable)
                {
                    sb.AppendLine($"    {JsonConvert.SerializeObject(item, Formatting.Indented)}");
                }
            }
            else
            {
                sb.AppendLine(
                    $"  {prop.Name}: {JsonConvert.SerializeObject(value, Formatting.Indented)}"
                );
            }
        }

        // Handle errors
        if (response.Errors != null)
        {
            sb.AppendLine("\tErrors\t :");
            if (response.Errors is string s)
            {
                string responseString = response.Errors as string;
                sb.AppendLine($"\t  {s}");
            }
            else if (response.Errors is System.Collections.IDictionary dict)
            {
                foreach (System.Collections.DictionaryEntry entry in dict)
                {
                    sb.AppendLine($"\t  {entry.Key}: {JsonConvert.SerializeObject(entry.Value, Formatting.Indented)}");
                }
            }
            else
            {
                sb.AppendLine($"\t  {JsonConvert.SerializeObject(response.Errors, Formatting.Indented)}");
            }
        }
        else
        {
            sb.AppendLine("\tErrors\t : No errors");
        }

        return sb.ToString();
    }
}

public class CragData : CustomWebRequest.WebRequestResponseData
{
    [JsonProperty("crag_id")]
    public string CragId { get; set; }

    [JsonProperty("name")]
    public string Name { get; set; }

    [JsonProperty("location_lat")]
    public double LocationLat { get; set; }

    [JsonProperty("location_lon")]
    public double LocationLon { get; set; }

    [JsonProperty("description")]
    public string Description { get; set; }

    [JsonProperty("image_urls")]
    public List<string> ImageUrls { get; set; }
}
public class UserData : CustomWebRequest.WebRequestResponseData
{
    [JsonProperty("user_id")]
    public string UserId { get; set; }

    [JsonProperty("full_name")]
    public string FullName { get; set; }

    [JsonProperty("email")]
    public string Email { get; set; }

    [JsonProperty("profile_picture")]
    public string ProfilePicture { get; set; }

    [JsonProperty("role")]
    public string Role { get; set; }   // "admin" or "member"

    [JsonProperty("status")]
    public bool Status { get; set; }
}
public class PostData : CustomWebRequest.WebRequestResponseData
{
    [JsonProperty("post_id")]
    public string PostId { get; set; }

    [JsonProperty("user")]
    public UserData User { get; set; }

    [JsonProperty("content")]
    public string Content { get; set; }

    [JsonProperty("tags")]
    public List<string> Tags { get; set; }

    [JsonProperty("image_urls")]
    public List<string> ImageUrls { get; set; }

    [JsonProperty("status")]
    public string Status { get; set; }

    [JsonProperty("created_at")]
    public DateTime CreatedAtUtc { get; set; }

    // Optional helper to get local time
    [JsonIgnore]
    public DateTime CreatedAtLocal => CreatedAtUtc.ToLocalTime();
}
public class ClimbLogData : CustomWebRequest.WebRequestResponseData
{
    [JsonProperty("log_id")]
    public string LogId { get; set; }

    [JsonProperty("user")]
    public UserData User { get; set; }

    [JsonProperty("crag")]
    public CragData Crag { get; set; }

    [JsonProperty("route_name")]
    public string RouteName { get; set; }

    [JsonProperty("date_climbed")]
    public DateTime DateClimbed { get; set; }

    [JsonProperty("difficulty_grade")]
    public string DifficultyGrade { get; set; }

    [JsonProperty("notes")]
    public string Notes { get; set; }

    // Optional helper to get local time
    [JsonIgnore]
    public DateTime CreatedAtLocal => DateClimbed.ToLocalTime();
}
