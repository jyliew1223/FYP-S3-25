#if UNITY_EDITOR
using UnityEditor;
#endif

using UnityEngine;

public class TagAttribute : PropertyAttribute { }

#if UNITY_EDITOR
[CustomPropertyDrawer(typeof(TagAttribute))]
public class TagDrawer : PropertyDrawer
{
    public override void OnGUI(Rect position, SerializedProperty property, GUIContent label)
    {
        if (property.propertyType == SerializedPropertyType.String)
        {
            property.stringValue = EditorGUI.TagField(position, label, property.stringValue);
        }
        else
        {
            EditorGUI.LabelField(position, label.text, "Use [Tag] with string.");
        }
    }
}
#endif
