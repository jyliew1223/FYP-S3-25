using Newtonsoft.Json;
using Siccity.GLTFUtility;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using UnityEditor;
using UnityEngine.SceneManagement;

[System.Serializable]
public class ModelNormalizationData
{
    [JsonProperty("scale")]
    public float normalizedScale = 1f;

    [JsonProperty("pos_offset")]
    public Vector3 positionOffset;

    [JsonProperty("rot_offset")]
    public Vector3 rotationOffset;
}
[System.Serializable]
public class RouteData
{
    [JsonProperty("route_name")]
    public string routeName;
    [JsonProperty("points")]
    public RoutePoint[] points;
}
[System.Serializable]
public class RoutePoint
{
    [JsonProperty("order")]
    public int order;
    [JsonProperty("pos")]
    public Vector3 position;
}
[System.Serializable]
public class ModelReceivedMessage
{
    [JsonProperty("path")]
    public string path;
    [JsonProperty("normalizationJson")]
    public ModelNormalizationData normalizationData;
    [JsonProperty("routeJson")]
    public RouteData[] routeDatas;
}

public class UnityReceiverManager : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private Transform modelParent;
    [SerializeField] private GroundPlaneStageBehaviour groundPlaneStage;
    [SerializeField] private GameObject routePinPrefab;
    [SerializeField] private GameObject routeRendererPrefab;
    [SerializeField] private RouteSelector routeSelector;

    [Header("Settings")]
    [SerializeField] private float maxAllowedHeight = 2f;
    [SerializeField] private bool applyNormalization = true;

    public static UnityReceiverManager Instance { get; private set; }
    public bool IsModelLoaded { get; private set; } = false;
    public Dictionary<RouteData, GameObject> routes { get; private set; } = new();

    private Transform routesParent;
    private void Awake()
    {
        if (Instance != null)
        {
            Destroy(Instance.gameObject);
        }

        Instance = this;

        try
        {
            OnModelReceivedPath(UnityReceiver.Instance.indoorSceneJson);
            UnityReceiver.Instance.SendReadyMessage();
        }
        catch (Exception e)
        {
            Debug.LogError(" Auto-load error: " + e.Message);
            UnityReceiver.Instance.SendFailMessage();
            SceneManager.LoadScene("MainMenu");
        }
    }
    private void OnDestroy()
    {
        if (Instance == this)
        {
            Debug.Log($"{GetType().Name}: Destroying Instance");
            Instance = null;

            if (Instance != null)
            {
                Debug.LogError($"{GetType().Name}: Instance still not null after destroy: {Instance.gameObject.name}");
            }
        }
        else
        {
            Debug.Log($"{GetType().Name}: Destorying duplicates");
        }
    }
    public void OnModelReceivedPath(string json)
    {
        Debug.Log("GameManager received json: " + json, this);

        ModelReceivedMessage jsonData;

        try
        {
            jsonData = JsonConvert.DeserializeObject<ModelReceivedMessage>(json, JsonSettings.UnityFriendly);

            Debug.Log($"Path: {jsonData.path}");
            Debug.Log($"Normalization: {JsonConvert.SerializeObject(jsonData.normalizationData, JsonSettings.UnityFriendly)}");
            Debug.Log($"Route: {JsonConvert.SerializeObject(jsonData.routeDatas, JsonSettings.UnityFriendly)}");
        }
        catch (Exception e)
        {
            Debug.LogError(" JSON parse error: " + e.Message);
            return;
        }

        GameObject model;
        try
        {
            IsModelLoaded = LoadModel(jsonData.path, out model, jsonData.normalizationData);
        }
        catch (Exception e)
        {
            Debug.LogError(" Model loading error: " + e.Message);
            return;
        }

        routesParent = new GameObject("RoutesParent").transform;
        routesParent.SetParent(modelParent, false);

        Debug.Log(jsonData.routeDatas.Length);
        foreach (var routeData in jsonData.routeDatas)
        {
            GenerateRoute(routeData, model);
        }
    }
    private bool LoadModel(string path, out GameObject model, ModelNormalizationData data = null)
    {
        model = null;

        if (!System.IO.File.Exists(path))
        {
            Debug.LogError("File not found: " + path, this);
            return false;
        }

        try
        {
            model = Importer.LoadFromFile(path);

            AddMeshColliders(model);
            model.transform.SetParent(modelParent, false);

            if (data != null)
            {
                model.transform.localScale = Vector3.one * data.normalizedScale;
                model.transform.SetLocalPositionAndRotation(data.positionOffset, Quaternion.Euler(data.rotationOffset));
            }
            else
            {
                model.transform.SetLocalPositionAndRotation(Vector3.zero, Quaternion.identity);
                model.transform.localScale = Vector3.one;
            }

            float rawHeight = GetMeshHeight(model); // local mesh units
            Debug.Log("Raw mesh height: " + rawHeight);

            if (applyNormalization && rawHeight > maxAllowedHeight)
            {
                float scaleFactor = maxAllowedHeight / rawHeight;
                model.transform.localScale = Vector3.one * scaleFactor;
                Debug.Log("Applied scale factor: " + scaleFactor);
            }

            foreach (Renderer renderer in model.GetComponentsInChildren<Renderer>())
            {
                renderer.enabled = false;
            }
            foreach (Collider collider in model.GetComponentsInChildren<Collider>())
            {
                collider.enabled = false;
            }

            return true;
        }
        catch (Exception e)
        {
            Debug.LogError("Error loading model: " + e.Message, this);
            return false;
        }
    }
    private void AddMeshColliders(GameObject root)
    {
        MeshFilter[] meshFilters = root.GetComponentsInChildren<MeshFilter>();

        foreach (MeshFilter meshFilter in meshFilters)
        {
            MeshCollider collider = meshFilter.gameObject.AddComponent<MeshCollider>();
            collider.sharedMesh = meshFilter.sharedMesh;
            collider.convex = false;

            Debug.Log(" MeshColliders added", this);
        }
    }
    private float GetMeshHeight(GameObject root)
    {
        MeshFilter[] meshFilters = root.GetComponentsInChildren<MeshFilter>();
        if (meshFilters.Length == 0) return 0f;

        Bounds combined = meshFilters[0].sharedMesh.bounds;
        for (int i = 1; i < meshFilters.Length; i++)
            combined.Encapsulate(meshFilters[i].sharedMesh.bounds);

        return combined.size.y;
    }
    private Bounds GetBounds(GameObject root)
    {
        Renderer[] renderers = root.GetComponentsInChildren<Renderer>();
        if (renderers.Length == 0)
            return new Bounds(Vector3.zero, Vector3.zero);

        Bounds bounds = renderers[0].bounds;
        for (int i = 1; i < renderers.Length; i++)
        {
            bounds.Encapsulate(renderers[i].bounds);
        }

        return bounds;
    }
    public void GenerateRoute(RouteData routeData, GameObject model)
    {
        GameObject parent = Instantiate(routeRendererPrefab, routesParent);
        parent.name = routeData.routeName;
        RouteRenderer routeRenderer = parent.GetComponent<RouteRenderer>();

        routeData.points = routeData.points.OrderBy(p => p.order).ToArray();
        Bounds bounds = GetBounds(model);

        foreach (var point in routeData.points)
        {
            GameObject frag = Instantiate(routePinPrefab, parent.transform);
            frag.name = "Fragment";
            frag.transform.SetParent(parent.transform, false);


            // Convert 0–1 relative position back to world space
            float x = bounds.min.x + point.position.x * bounds.size.x;
            float y = bounds.min.y + point.position.y * bounds.size.y;
            float z = bounds.min.z + point.position.z * bounds.size.z;

            Debug.Log($"Point order: {point.order}");
            Debug.Log($"point.position.x: {point.position.x}, bounds.min.x: {bounds.min.x}, bounds.size.x: {bounds.size.x} => X = {x}");
            Debug.Log($"point.position.y: {point.position.y}, bounds.min.y: {bounds.min.y}, bounds.size.y: {bounds.size.y} => Y = {y}");
            Debug.Log($"point.position.z: {point.position.z}, bounds.min.z: {bounds.min.z}, bounds.size.z: {bounds.size.z} => Z = {z}");
            Debug.Log($"Final position: {new Vector3(x, y, z)}");

            Vector3 position = new(x, y, z);

            frag.transform.position = position;

            Collider[] colliders = model.GetComponentsInChildren<Collider>();
            foreach (var col in colliders)
                col.enabled = true;

            Vector3 dir = (position - bounds.center).normalized;
            RaycastHit[] hits = Physics.RaycastAll(bounds.center, dir);
            var modelHits = hits.Where(h => h.collider.transform.IsChildOf(model.transform)).ToArray();

            if (modelHits.Length > 0)
            {
                RaycastHit lastHit = modelHits.OrderBy(h => h.distance).Last();
                frag.transform.rotation = Quaternion.LookRotation(lastHit.normal);
            }
        }

        routeRenderer.UpdateRouteVisual();
        parent.SetActive(false);
        routes[routeData] = parent;
    }
    public void ExtractRouteData(List<Transform> routeDatas, Bounds bounds, string name = "New")
    {
        RouteData routeData = new();
        routeData.routeName = name;

        List<RoutePoint> points = new();
        int order = 1;

        Vector3 min = bounds.min;
        Vector3 size = bounds.size;

        foreach (Transform child in routeDatas)
        {
            // Get position relative to model bounds
            Vector3 relative = child.position - min;

            // Convert to 0–1 range relative to model size
            float relX = size.x != 0 ? Mathf.Clamp01(relative.x / size.x) : 0.5f;
            float relY = size.y != 0 ? Mathf.Clamp01(relative.y / size.y) : 0.5f;
            float relZ = size.z != 0 ? Mathf.Clamp01(relative.z / size.z) : 0.5f;

            Debug.Log($"--- Normalizing Route Point ---");
            Debug.Log($"Child world position: {child.position}");
            Debug.Log($"Bounds min: {bounds.min}, Bounds size: {size}");
            Debug.Log($"Relative: {relative}");
            Debug.Log($"X: relative.x={relative.x}, size.x={size.x}, relX={relX}");
            Debug.Log($"Y: relative.y={relative.y}, size.y={size.y}, relY={relY}");
            Debug.Log($"Z: relative.z={relative.z}, size.z={size.z}, relZ={relZ}");
            Debug.Log($"Normalized position: new Vector3({relX}, {relY}, {relZ})");

            RoutePoint point = new()
            {
                order = order,
                position = new Vector3(relX, relY, relZ)
            };

            points.Add(point);
            order++;
        }

        routeData.points = points.OrderBy(p => p.order).ToArray();

        if (UnityReceiver.Instance != null)
        {
            UnityReceiver.Instance.SendRouteDataToRN(routeData);
        }
        else
        {
            Debug.LogError("[UnityReceiverManager] UnityReceiver instance not found, cannot send message to RN");
        }
    }
}
