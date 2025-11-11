using Newtonsoft.Json;
using UnityEngine;

public static class JsonSettings
{
    public static readonly JsonSerializerSettings UnityFriendly = new JsonSerializerSettings
    {
        Converters = { new Vector3Converter() },
        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
        Formatting = Formatting.Indented
    };
}

public class Vector3Converter : JsonConverter<Vector3>
{
    public override void WriteJson(JsonWriter writer, Vector3 value, JsonSerializer serializer)
    {
        writer.WriteStartObject();
        writer.WritePropertyName("x");
        writer.WriteValue(value.x);
        writer.WritePropertyName("y");
        writer.WriteValue(value.y);
        writer.WritePropertyName("z");
        writer.WriteValue(value.z);
        writer.WriteEndObject();
    }

    public override Vector3 ReadJson(JsonReader reader, System.Type objectType, Vector3 existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        float x = 0, y = 0, z = 0;

        while (reader.Read())
        {
            if (reader.TokenType == JsonToken.EndObject)
                break;

            if (reader.TokenType == JsonToken.PropertyName)
            {
                string propName = (string)reader.Value;
                reader.Read();
                switch (propName)
                {
                    case "x": x = float.Parse(reader.Value.ToString()); break;
                    case "y": y = float.Parse(reader.Value.ToString()); break;
                    case "z": z = float.Parse(reader.Value.ToString()); break;
                }
            }
        }
        return new Vector3(x, y, z);
    }
}
