using System.Runtime.CompilerServices;
using UnityEngine;
using Vuforia;

public class MyImageTargetBehaviour : DefaultObserverEventHandler
{
    [SerializeField] GameObject myModelPrefab;
    [SerializeField] float modelHeight;

    GameObject mMyModelObject;
    Vector3 normalizeScale;

    protected override void OnTrackingFound()
    {
        Debug.Log("Target Found");

        // Instantiate the model prefab only if it hasn't been instantiated yet
        if (mMyModelObject == null)
            InstantiatePrefab();

        base.OnTrackingFound();
    }

    void InstantiatePrefab()
    {
        if (myModelPrefab != null)
        {
            Debug.Log("Target found, adding content");
            mMyModelObject = Instantiate(myModelPrefab, mObserverBehaviour.transform);

            float currentHeight = mMyModelObject.GetComponentInChildren<Renderer>().bounds.size.y;
            float factor = modelHeight / currentHeight;


            normalizeScale = transform.localScale * factor;
            mMyModelObject.transform.localScale = normalizeScale;
            mMyModelObject.SetActive(true);
        }
    }

    public void ChangeModelSize(float size)
    {
        if (mMyModelObject == null) return;

        Vector3 newScale = normalizeScale * size;

        mMyModelObject.transform.localScale = newScale;
    }
}