using Newtonsoft.Json;
using System.IO;
using UnityEngine;

using UnityEngine.Android;

public class MockModelSender : MonoBehaviour
{
    [SerializeField] private bool load = false;
    [SerializeField] private bool loadOutdoor = false;
    [SerializeField] private bool clear = false;
    [SerializeField] private string receiverManager;
    [SerializeField] private string routeSelector;
    [SerializeField] private string planeDetector;
    public UnityReceiver gameManager;
    public string modelFileName = "TestModel.glb";

    private static MockModelSender Instance;

    private void Awake()
    {
#if !UNITY_EDITOR
        Destroy(gameObject); 
#endif
        if (Instance != null && Instance != this)
        {
            Destroy(this.gameObject);
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }
    private void Update()
    {
        if (load)
        {
            load = false;
            LoadIndoor();
        }
        if (loadOutdoor)
        {
            loadOutdoor = false;
            gameManager.LoadOutdoorScene("");
        }
        if (clear)
        {
            clear = false;
            gameManager.ClearScene("");
        }


        receiverManager = UnityReceiverManager.Instance == null ? "None" : UnityReceiverManager.Instance.gameObject.name;
        routeSelector = RouteSelector.Instance == null ? "None" : RouteSelector.Instance.gameObject.name;
        planeDetector = PlaneDetectorBehaviour.Instance == null ? "None" : PlaneDetectorBehaviour.Instance.gameObject.name;
    }

    void LoadIndoor()
    {
        // string path = System.IO.Path.Combine(Application.streamingAssetsPath, modelFileName);
        //string path = " C:/Users/PC/Desktop/SIM Documents/CSIT321 Project/FYP/Github/Unity_Project/Unity_Project/Assets/StreamingAssets/TestModel/test.glb";
        string path = modelFileName;
        Debug.Log("Mock sending path: " + path);

        string routeJson = @"[
                                {
                                  ""route_name"": ""New"",
                                  ""points"": [
                                    {
                                      ""order"": 1,
                                      ""pos"": {
                                        ""x"": 0.487378329,
                                        ""y"": 0.185744524,
                                        ""z"": 0.175995618
                                      },
                                    }                         ,
{
                                      ""order"": 1,
                                      ""pos"": {
                                        ""x"": 0.487378329,
                                        ""y"": 0.285744524,
                                        ""z"": 0.175995618
                                      },
                                    }
                                  ]
                                },                                
                                {
                                  ""route_name"": ""New1"",
                                  ""points"": [
                                    {
                                      ""order"": 1,
                                      ""pos"": {
                                        ""x"": 0.557378329,
                                        ""y"": 0.185744524,
                                        ""z"": 0.175995618
                                      }
                                    }              ,
{
                                      ""order"": 1,
                                      ""pos"": {
                                        ""x"": 0.487378329,
                                        ""y"": 0.385744524,
                                        ""z"": 0.175995618
                                      },
                                    }
                                  ]
                                },                           
                                {
                                  ""route_name"": ""New1"",
                                  ""points"": [
                                    {
                                      ""order"": 1,
                                      ""pos"": {
                                        ""x"": 0.687378329,
                                        ""y"": 0.185744524,
                                        ""z"": 0.175995618
                                      }
                                    }              ,
{
                                      ""order"": 1,
                                      ""pos"": {
                                        ""x"": 0.487378329,
                                        ""y"": 0.485744524,
                                        ""z"": 0.175995618
                                      },
                                    }
                                  ]
                                },
                            ]
                            ";

        var modelMessage = new ModelReceivedMessage
        {
            path = path,
            normalizationData = new ModelNormalizationData
            {
                normalizedScale = 0.001f,
                positionOffset = Vector3.zero,
                rotationOffset = new Vector3(0, 0, 0)
            },
            routeDatas = JsonConvert.DeserializeObject<RouteData[]>(routeJson),
            //routeData = new RouteData
            //{
            //    routeName = "default_route",
            //    points = new[] {
            //        new RoutePoint { order = 1, position = new Vector3(0, 0, 0) },
            //        new RoutePoint { order = 2, position = new Vector3(1, 0, 0) },
            //        new RoutePoint { order = 3, position = new Vector3(0, 1, 0) },
            //        new RoutePoint { order = 4, position = new Vector3(0, 0, 1) },
            //        new RoutePoint { order = 5, position = new Vector3(1, 1, 1) },
            //    }
            //}
        };

        string jsonString = JsonConvert.SerializeObject(modelMessage, JsonSettings.UnityFriendly);

        Debug.Log(jsonString);

        gameManager.LoadIndoorScene(jsonString);
    }
    void CheckPathStepByStep(string fullPath)
    {
        Debug.Log($"Checking path: {fullPath}");

        string normalized = fullPath.Replace('\\', '/').Trim('/');
        string[] segments = normalized.Split('/');
        string current = "";

        for (int i = 0; i < segments.Length; i++)
        {
            current = "/" + string.Join("/", segments, 0, i + 1);
            bool dirExists = Directory.Exists(current);
            bool fileExists = File.Exists(current);

            Debug.Log($"[{i + 1}/{segments.Length}] {current} | DirExists={dirExists}, FileExists={fileExists}");

            if (!dirExists && !fileExists)
            {
                Debug.LogWarning($"❌ Path stops existing here: {current}");
                return;
            }
        }

        Debug.Log($"✅ Entire path exists. FileExists={File.Exists(fullPath)}");
    }
}
