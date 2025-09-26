import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { getApps, initializeApp } from 'firebase/app';

export default function FirebaseStatusCheck() {
  const [isFirebaseInit, setIsFirebaseInit] = useState(false);

  const handleFirebaseCheck = () => {
    try {
      // Initialize Firebase only if it hasn't been initialized
      if (!getApps().length) {
        initializeApp();
      }
      setIsFirebaseInit(true);
      alert('Firebase is initialized ✅');
    } catch (error) {
      setIsFirebaseInit(false);
      alert(`Firebase initialization failed ❌\n${error.message}`);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Check Firebase" onPress={handleFirebaseCheck} />

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        {isFirebaseInit ? (
          <Text>Firebase is initialized ✅</Text>
        ) : (
          <Text>Firebase not initialized ❌</Text>
        )}
      </View>
    </View>
  );
}
