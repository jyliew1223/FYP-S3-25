import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Animated, Alert, PermissionsAndroid, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import UnityView from '@azesmway/react-native-unity';
import { enableFullscreen, disableFullscreen } from '../utils/FullscreenHelper';

export default function UnityOutdoorARScreen({ navigation }) {
  const unityRef = useRef(null);
  const [showUnity, setShowUnity] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Real Field AR...');
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
          message: 'This app needs camera access to provide Real Field AR experience.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('[UnityOutdoorARScreen] Camera permission granted');
        setCameraPermissionGranted(true);
        return true;
      } else {
        console.log('[UnityOutdoorARScreen] Camera permission denied');
        Alert.alert(
          'Camera Permission Required',
          'Camera access is required for Real Field AR functionality. Please enable camera permission in app settings.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
        return false;
      }
    } catch (err) {
      console.warn('[UnityOutdoorARScreen] Camera permission error:', err);
      navigation.goBack();
      return false;
    }
  }, [navigation]);

  useEffect(() => {
    enableFullscreen();
    
    // Request camera permission when component mounts
    requestCameraPermission();
    
    return () => {
      disableFullscreen();
    };
  }, [requestCameraPermission]);

  const sendToUnity = useCallback((gameObject, methodName, message) => {
    try {
      if (unityRef?.current) {
        unityRef.current.postMessage(gameObject, methodName, message);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);

  const clearUnityScene = useCallback(() => {
    const clearData = { action: 'clear_scene', reason: 'load_new', timestamp: Date.now() };
    return sendToUnity('UnityReceiver', 'ClearScene', JSON.stringify(clearData));
  }, [sendToUnity]);

  const loadOutdoorScene = useCallback(() => {
    clearUnityScene();
    setTimeout(() => {
      setLoadingMessage('Loading Real Field AR...');
      sendToUnity('UnityReceiver', 'LoadOutdoorScene', '');
    }, 1000);
  }, [sendToUnity, clearUnityScene]);

  useEffect(() => {
    // Only start AR engine if camera permission is granted
    if (cameraPermissionGranted) {
      setLoadingMessage('Starting AR Engine...');
      setTimeout(() => {
        loadOutdoorScene();
      }, 3000);
    }
  }, [loadOutdoorScene, cameraPermissionGranted]);

  useFocusEffect(
    useCallback(() => {
      clearUnityScene();
      return () => {
        setShowUnity(false);
        fadeAnim.setValue(1);
      };
    }, [clearUnityScene, fadeAnim])
  );

  const handleMessage = useCallback((result) => {
    const message = result.nativeEvent.message;
    
    if (message === 'UNITY_READY') {
      setLoadingMessage('Real Field AR Ready!');
      setShowUnity(true);
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 100);
      return;
    }
    
    if (message.startsWith('UNITY_FAIL')) {
      setLoadingMessage('AR Engine Error');
      navigation.goBack();
    }
  }, [navigation, fadeAnim]);

  // Don't render Unity until camera permission is granted
  if (!cameraPermissionGranted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Requesting Camera Permission...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <UnityView
        ref={unityRef}
        style={styles.unity}
        onUnityMessage={handleMessage}
        onPlayerQuit={() => {
          setShowUnity(false);
          setLoadingMessage('AR Engine Stopped');
          fadeAnim.setValue(1);
          navigation.goBack();
        }}
      />

      {!showUnity && (
        <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Real Field AR Experience</Text>
            <Text style={styles.loadingSubtext}>{loadingMessage}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  unity: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});