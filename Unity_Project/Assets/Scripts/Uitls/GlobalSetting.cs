class GlobalSetting
{
    public const string BaseUrl = "https://goclimb-web.onrender.com/";
#if UNITY_EDITOR
    public const string TestUserEmail = "testuser001@gmail.com";
    public const string TestUserPassword = "testuser001";
    // public const string BaseUrl = "http://127.0.0.1:8000/";
#else
#endif

    public const float msgCountdown = .5f;

    public const int MaxWebRequestFailedCount = 5;
    public const int WebRequestRetryCooldown = 1000; // in milliseconds
}

public static class Tags
{
    public const string MainContainer = "MainContainer";
}

namespace System.Runtime.CompilerServices
{
    internal static class IsExternalInit { }
}
