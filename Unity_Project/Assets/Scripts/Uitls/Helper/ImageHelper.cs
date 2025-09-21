using UnityEngine;
using System.Collections.Generic;

public class ImageHelper
{
    private static List<Sprite> sprites = new(){
        Resources.Load<Sprite>("Images/broken_image"),
        Resources.Load<Sprite>("Images/image0"),
        Resources.Load<Sprite>("Images/image1"),
        Resources.Load<Sprite>("Images/image2"),
        Resources.Load<Sprite>("Images/image3"),
        Resources.Load<Sprite>("Images/image4"),
        Resources.Load<Sprite>("Images/image5"),
        Resources.Load<Sprite>("Images/image6"),
        Resources.Load<Sprite>("Images/image7")

    };
    private static void EnsureLoaded()
    {
        if (sprites == null)
        {
            sprites = new List<Sprite>
            {
                Resources.Load<Sprite>("Images/broken_image"),
                Resources.Load<Sprite>("Images/image0"),
                Resources.Load<Sprite>("Images/image1"),
                Resources.Load<Sprite>("Images/image2"),
                Resources.Load<Sprite>("Images/image3"),
                Resources.Load<Sprite>("Images/image4"),
                Resources.Load<Sprite>("Images/image5"),
                Resources.Load<Sprite>("Images/image6"),
                Resources.Load<Sprite>("Images/image7"),
            };
        }

        for(int i = 0; i < sprites.Count; i++) 
        {
                if (sprites[i] == null)
            {
                Debug.LogWarning($"{nameof(ImageHelper)}: Image{i-1} is null");
            }
        }
    }
    public static Sprite GetErrorSprite()
    {
        EnsureLoaded();
        int index = Random.Range(0, sprites.Count); // upper bound is exclusive
        return sprites[index];
    }
}
