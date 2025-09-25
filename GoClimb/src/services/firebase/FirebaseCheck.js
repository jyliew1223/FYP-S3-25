
//service/firebase/FirebaseHelper/js

import React, { useEffect, useInsertionEffect, useState } from 'react';
import { View, Text } from 'react-native';
import firebase from '@react-native-firebase/app';

import { CustomApiRequest , RequestMethod} from '../api/ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';

export function FirebaseCheck() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!firebase.apps.length > 0) {
      setIsInitialized(false);
      return;
    }

    const request = new CustomApiRequest(RequestMethod.GET, API_ENDPOINTS.BASE_URL, API_ENDPOINTS.AUTH.VERIFY_APP_CHECK_TOKEN, new Object, true);
    let result = request.sendRequest()

    if(result){
      setIsInitialized(true);
    }

  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {isInitialized ? (
        <Text>Firebase App check is connected ✅</Text>
      ) : (
        <Text>Firebase App check not initialized ❌</Text>
      )}
    </View>
  );
}
