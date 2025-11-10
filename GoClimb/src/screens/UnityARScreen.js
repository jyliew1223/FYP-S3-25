import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { enableFullscreen, disableFullscreen } from '../utils/FullscreenHelper';
import UnityViewerDirect from '../components/UnityViewerDirect';

export default function UnityARScreen({ route, navigation }) {
  const { modelData, cragId } = route.params || {};

  // Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true; // Prevent default behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  // Handle fullscreen mode
  useEffect(() => {
    console.log('[UnityARScreen] Entering fullscreen mode');
    enableFullscreen();
    
    return () => {
      console.log('[UnityARScreen] Exiting fullscreen mode');
      disableFullscreen();
    };
  }, []);

  // Unity callbacks
  const handleUnityReady = useCallback(() => {
    console.log('[UnityARScreen] Unity ready for AR experience');
  }, []);

  const handleUnityMessage = useCallback((message) => {
    // console.log('[UnityARScreen] Unity message:', message);
    
    // if (message === 'UNITY_READY') {
    //   console.log('[UnityARScreen] AR experience fully loaded');
    // }
  }, []);



  if (!modelData) {
    console.error('[UnityARScreen] No model data provided');
    navigation.goBack();
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        hidden={true} 
        backgroundColor="transparent" 
        translucent={true}
        barStyle="light-content"
      />
      
      <UnityViewerDirect
        modelData={modelData}
        onUnityReady={handleUnityReady}
        onUnityMessage={handleUnityMessage}
        modelId={modelData.model_id}
        cragId={cragId}
        autoSaveRouteData={true}
        style={styles.unityView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  unityView: {
    flex: 1,
  },
});