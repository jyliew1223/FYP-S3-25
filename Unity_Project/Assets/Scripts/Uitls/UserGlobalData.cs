using UnityEngine;
using Firebase.Auth;

public static class UserGlobalData
{
    private static bool isLoggedIn = false;
    private static string idToken; 

    public static string IDToken
    {
        get => idToken;
        set
        {
            if (!isLoggedIn)
            {
                idToken = value;
                isLoggedIn = true;
                Debug.Log("User logged in, IDToken set.");
            }
            else
            {
                Debug.LogWarning("IDToken is already set. Overwriting the existing token and signing out previous user.");

                // Sign out the previous Firebase user
                if (FirebaseAuth.DefaultInstance.CurrentUser != null)
                {
                    FirebaseAuth.DefaultInstance.SignOut();
                    Debug.Log("Previous user signed out.");
                }

                // Set new token
                idToken = value;
            }
        }
    }

    public static void SignOut()
    {
        if (isLoggedIn)
        {
            if (FirebaseAuth.DefaultInstance.CurrentUser != null)
            {
                FirebaseAuth.DefaultInstance.SignOut();
            }
            idToken = null;
            isLoggedIn = false;
            Debug.Log("User signed out and IDToken cleared.");
        }
    }
}
