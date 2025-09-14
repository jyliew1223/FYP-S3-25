using System;
using System.Linq;
using System.Text;
using Newtonsoft.Json;
using UnityEngine.Networking;

public record WebResponse
{
    public bool success;
    public string message;
    public string errors;
    public bool Success
    {
        get { return success; }
    }
    public string Message
    {
        get { return message; }
    }
    public string Errors
    {
        get { return errors; }
    }
}

public class WebResponseHelper
{
    public static string LogResponse<T>(T response, UnityWebRequest request, string prefix = "")
        where T : WebResponse
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

        sb.AppendLine($"\tStatusCode : {request.responseCode}");
        sb.AppendLine($"\tSuccess\t : {response.Success}");
        sb.AppendLine($"\tMessage\t : {response.Message ?? "No message"}");

        // Print all child-specific properties
        var baseProperties = typeof(WebResponse).GetProperties().Select(p => p.Name).ToHashSet();

        var childProperties = typeof(T)
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

        sb.AppendLine($"\tErrors\t : {response.Errors ?? "No errors"}");

        return sb.ToString();
    }
}
