import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, StatusBar, BackHandler, Alert, PermissionsAndroid, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { enableFullscreen, disableFullscreen } from '../utils/FullscreenHelper';
import UnityViewerDirect from '../components/UnityViewerDirect';

export default function UnityARScreen({ route, navigation }) {
  const { modelData, cragId } = route.params || {};
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);

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

  // Request camera permission
  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setCameraPermissionGranted(true);
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission Required',
          message: 'This app needs camera access to provide AR experience.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('[UnityARScreen] Camera permission granted');
        setCameraPermissionGranted(true);
        return true;
      } else {
        console.log('[UnityARScreen] Camera permission denied');
        Alert.alert(
          'Camera Permission Required',
          'Camera access is required for AR functionality. Please enable camera permission in app settings.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
        return false;
      }
    } catch (err) {
      console.warn('[UnityARScreen] Camera permission error:', err);
      navigation.goBack();
      return false;
    }
  }, [navigation]);

  // Handle fullscreen mode and camera permission
  useEffect(() => {
    console.log('[UnityARScreen] Entering fullscreen mode');
    enableFullscreen();
    
    // Request camera permission when component mounts
    requestCameraPermission();
    
    return () => {
      console.log('[UnityARScreen] Exiting fullscreen mode');
      disableFullscreen();
    };
  }, [requestCameraPermission]);

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

  // Don't render Unity until camera permission is granted
  if (!cameraPermissionGranted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar 
          hidden={true} 
          backgroundColor="transparent" 
          translucent={true}
          barStyle="light-content"
        />
      </View>
    );
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