// src/services/firebase/FirebaseStatusCheck.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { firebase } from '@react-native-firebase/app';

export default function FirebaseStatusCheck() {
  const [isFirebaseInit, setIsFirebaseInit] = useState(false);

  const handleFirebaseCheck = () => {
    try {
      const app = firebase.app(); // default app
      console.log('Firebase app name:', app.name);
      setIsFirebaseInit(true);
    } catch (error) {
      setIsFirebaseInit(false);
      console.log(`Firebase initialization failed ❌\n${error.message}`);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Check Firebase" onPress={handleFirebaseCheck} />

      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        <Text>
          {isFirebaseInit
            ? 'Firebase is initialized ✅'
            : 'Firebase not initialized ❌'}
        </Text>
      </View>
    </View>
  );
}
