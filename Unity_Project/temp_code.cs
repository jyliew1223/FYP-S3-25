   ===============================================
   For SignUp
   ===============================================
   
   IEnumerator Test()
    {
        Debug.Log($"{GetType().Name}: Initializing...");

        Task initFirebaseTask = InitFirebase();
        while (!initFirebaseTask.IsCompleted) yield return null;

        if (auth == null)
        {
            Debug.LogError($"{GetType().Name}: Firebase Auth is not initialized.");
            yield break;
        }

        Task<bool> signUpFirebaseTask = SignupFirebaseWithEmailAndPassword("testuser002@gmail.com", "testuser002");
        while (!signUpFirebaseTask.IsCompleted) yield return null;
        bool success = signUpFirebaseTask.Result;

        if (success)
        {
            var tokenTask = auth.CurrentUser.TokenAsync(true);
            while (!tokenTask.IsCompleted) yield return null;

            if (tokenTask.IsFaulted || tokenTask.IsCanceled)
            {
                Debug.LogError("Failed to get token: " + tokenTask.Exception);
                yield break;
            }

            GlobalData.IDToken = tokenTask.Result;

            if (String.IsNullOrEmpty(GlobalData.IDToken))
            {
                Debug.LogError($"{GetType().Name}: ID Token is null or empty after Sign-in.");
                yield break;
            }

            Debug.Log($"{GetType().Name}: ID Token: {GlobalData.IDToken}");

            yield return new WaitForSeconds(GlobalSetting.AuthenticationCooldown);

            Task<bool> verifyIdTokenTask = VerifyIdToken(GlobalData.IDToken);
            while (!verifyIdTokenTask.IsCompleted) yield return null;

            if (!verifyIdTokenTask.Result)
            {
                Debug.LogWarning($"{GetType().Name}: Failed to verify Token, Signing user out...");
                auth.SignOut();
                yield break;
            }

            yield return new WaitForSeconds(GlobalSetting.AuthenticationCooldown);

            Task<bool> signUpUserTask = SignUpUser(GlobalData.IDToken, "testuser002", "testuser002@gmail.com");
            while (!signUpUserTask.IsCompleted) yield return null;
            bool signUpSuccess = signUpUserTask.Result;

            if (!signUpSuccess)
            {
                Debug.LogError($"{GetType().Name}: User sign-up failed.");
            }
        }
    }


    async Task<bool> SignupFirebaseWithEmailAndPassword(string email, string password)
    {
        if (auth == null) return false;

        Debug.Log($"{GetType().Name}: Signing up Firebase user with email and password...");

        try
        {
            AuthResult result = await auth.CreateUserWithEmailAndPasswordAsync(email, password);
            FirebaseUser newUser = result.User;
            if (newUser == null)
            {
                Debug.LogError(
                    $"{GetType().Name}: CreateUserWithEmailAndPasswordAsync completed but returned null user.");
                return false;
            }

            Debug.Log($"{GetType().Name}: Firebase user signed up successfully: {newUser.DisplayName ?? newUser.Email}");
            return true;
        }
        catch (FirebaseException e)
        {
            var errorCode = (AuthError)e.ErrorCode;
            switch (errorCode)
            {
                case AuthError.EmailAlreadyInUse:
                    Debug.LogError($"{GetType().Name}: Email already in use. Please try a different email.");
                    return false;
                case AuthError.InvalidEmail:
                    Debug.LogError($"{GetType().Name}: Invalid email format.");
                    return false;
                case AuthError.WeakPassword:
                    Debug.LogError($"{GetType().Name}: Password is too weak. Please choose a stronger password.");
                    return false;
                case AuthError.NetworkRequestFailed:
                    Debug.LogError($"{GetType().Name}: Network error. Please check your connection.");
                    return false;
                default:
                    Debug.LogError($"{GetType().Name}: Firebase sign-up error: {e.Message}");
                    return false;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"{GetType().Name}: Error during sign-up: {e}");
            return false;
        }
    }


    

    //INPUT:{
    //    "id_token": str,
    //    "full_name": str,
    //    "email": str
    //}
    //OUTPUT:{
    //    "success": bool,
    //    "message": str
    //}"
    private record SignUpResponse
    {
        public bool success;
        public string message;
        public string errors;
    }
    private record SignUpRequest
    {
        public string id_token;
        public string full_name;
        public string email;
    }
    async Task<bool> SignUpUser(string idToken, string fullName, string email)
    {
        Debug.Log($"{GetType().Name}: Signing Up new user...");

        using UnityWebRequest request = new(GlobalSetting.BaseUrl + "signup/", "POST");
        request.timeout = 10;
        request.SetRequestHeader("Authorization", "Bearer " + idToken);
        request.SetRequestHeader("Content-Type", "application/json");

        SignUpRequest reqData = new()
        {
            id_token = idToken,
            full_name = fullName,
            email = email
        };

        string jsonData = JsonUtility.ToJson(reqData);
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();

        try
        {
            var operation = request.SendWebRequest();
            while (!operation.isDone)
                await Task.Yield();


            SignUpResponse response = JsonUtility.FromJson<SignUpResponse>(request.downloadHandler.text);

            if (request.result != UnityWebRequest.Result.Success)
            {
                if (!String.IsNullOrEmpty(response.errors))
                {
                    try
                    {
                        JObject parsedJson = JObject.Parse(response.errors);
                        string prettyJson = parsedJson.ToString(Formatting.Indented);
                        Debug.LogError($"{GetType().Name}: Signup request failed: {request.error}: {prettyJson}");
                    }
                    catch (JsonReaderException e)
                    {
                        Debug.LogError($"{GetType().Name}: Failed to parse error JSON: {e.Message}\nRaw error string: {response.errors}");
                    }
                }
                else
                {
                    Debug.LogError($"{GetType().Name}: Signup request failed: {request.error}: {response.message ?? "No message..."}");
                }
                return false;
            }

            if (response.success)
            {
                Debug.Log($"{GetType().Name}: User signed up successfully: {response.message}");
                return true;
            }
            else
            {
                Debug.LogError($"{GetType().Name}: Sign-up failed: {response.message}");
                return false;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"{GetType().Name}: Exception during HTTP request: {e}");
            return false;
        }
    }
