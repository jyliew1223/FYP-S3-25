import React, { useRef, useEffect, useState, useCallback } from 'react';
import UnityView from '@azesmway/react-native-unity';
import { View, Alert, ActivityIndicator, Text, StyleSheet, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { RouteDataStorage } from '../services/storage/RouteDataStorage';

const UnityViewerDirect = ({
    modelData,
    onUnityReady,
    onUnityMessage,
    style,
    modelId,
    cragId,
    autoSaveRouteData = false
}) => {
    const unityRef = useRef(null);

    const [showUnity, setShowUnity] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Initializing AR Engine...');
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Handle Unity messages
    const handleMessage = useCallback(async (result) => {
        const message = result.nativeEvent.message;
        console.log('[UnityViewerDirect] Message from Unity:', message);

        try {
            if (message === 'UNITY_READY') {
                console.log('[UnityViewerDirect] ✅ Unity is ready, showing Unity view');

                setLoadingMessage('AR Ready!');
                
                // Show Unity and fade out overlay
                setShowUnity(true);
                setTimeout(() => {
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }).start();
                }, 100);

                if (onUnityReady) onUnityReady();
                return;
            }

            if (message.startsWith('UNITY_FAIL')) {
                console.error('[UnityViewerDirect] Unity error:', message);
                setLoadingMessage('AR Engine Error');
                Alert.alert('AR Error', message.includes(':') ? message.split(':')[1] : 'Unknown error');
                return;
            }

            // Handle route data saving
            try {
                const routeData = JSON.parse(message);
                if (routeData.route_name && routeData.points && autoSaveRouteData) {
                    // Generate numeric route name with # prefix
                    const numericId = Date.now().toString();
                    const routeName = `#${numericId}`;
                    const displayName = routeData.display_name || routeData.custom_name || routeName;
                    const cleanRouteData = { route_name: routeName, points: routeData.points };
                    await RouteDataStorage.saveRouteData({
                        modelId, cragId,
                        routeData: cleanRouteData, customName: displayName
                    });
                    Alert.alert('Route Saved', `Route "${displayName}" saved locally`);
                }
            } catch (parseError) {
                // Not JSON data, continue with normal message handling
            }

            // Forward message to parent component
            if (onUnityMessage) onUnityMessage(message);

        } catch (error) {
            console.error('[UnityViewerDirect] Message error:', error);
        }
    }, [onUnityReady, onUnityMessage, autoSaveRouteData, modelId, cragId, fadeAnim]);

    // Send message to Unity
    const sendToUnity = useCallback((gameObject, methodName, message) => {
        try {
            if (unityRef?.current) {
                console.log(`[UnityViewerDirect] 📤 Sending to Unity: ${gameObject}.${methodName}`);
                unityRef.current.postMessage(gameObject, methodName, message);
                return true;
            } else {
                console.warn(`[UnityViewerDirect] ❌ Cannot send to Unity: unityRef is null`);
                return false;
            }
        } catch (error) {
            console.error(`[UnityViewerDirect] ❌ Error sending to Unity:`, error);
            return false;
        }
    }, []);

    // Clear Unity scene
    const clearUnityScene = useCallback(() => {
        console.log('[UnityViewerDirect] 🧹 Clearing Unity scene...');
        const clearData = { action: 'clear_scene', reason: 'load_new', timestamp: Date.now() };
        return sendToUnity('UnityReceiver', 'ClearScene', JSON.stringify(clearData));
    }, [sendToUnity]);

    // Load scene data to Unity
    const loadUnityScene = useCallback(async (sceneData) => {
        console.log('[UnityViewerDirect] 🎬 Loading Unity scene...');
        
        // First clear the scene
        console.log('[UnityViewerDirect] 🧹 Clearing scene before load...');
        clearUnityScene();
        
        // Wait for clear to complete, then load new scene
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('[UnityViewerDirect] 📥 Loading new scene data...');
                const success = sendToUnity('UnityReceiver', 'LoadIndoorScene', JSON.stringify(sceneData));
                if (success) {
                    console.log('[UnityViewerDirect] ✅ Scene data sent to Unity');
                } else {
                    console.log('[UnityViewerDirect] ❌ Failed to send scene data');
                }
                resolve(success);
            }, 1000); // 300ms delay after clear
        });
    }, [sendToUnity, clearUnityScene]);

    // Main effect: Load scene when model data is available
    useEffect(() => {
        if (!modelData?.path) return;

        console.log('[UnityViewerDirect] 🚀 Starting Unity with model:', modelData.path);
        setLoadingMessage('Preparing 3D Model...');

        const loadScene = async () => {
            try {
                // Find the .glb file in the directory
                let glbPath = modelData.path;
                if (!glbPath.endsWith('.glb')) {
                    const files = await RNFS.readDir(modelData.path);
                    const glbFile = files.find(file => file.name.endsWith('.glb'));
                    if (!glbFile) {
                        setLoadingMessage('3D Model Not Found');
                        return;
                    }
                    glbPath = glbFile.path;
                }

                // Prepare scene data
                const sceneData = {
                    path: glbPath,
                    normalizationJson: modelData.normalizationJson || {
                        scale: 0.001,
                        pos_offset: { x: 0, y: 0, z: 0 },
                        rot_offset: { x: 90, y: 0, z: 0 }
                    },
                    routeJson: modelData.routeJson || []
                };

                console.log('[UnityViewerDirect] Scene data prepared for:', glbPath);

                // Wait for Unity to initialize, then send data
                setLoadingMessage('Starting AR Engine...');
                setTimeout(async () => {
                    // Always clear before load
                    clearUnityScene();
                    
                    // Wait a bit, then load
                    setTimeout(() => {
                        setLoadingMessage('Loading 3D Model...');
                        loadUnityScene(sceneData);
                    }, 200); // 200ms delay after clear
                }, 3000); // 3 second initial delay

            } catch (error) {
                console.error('[UnityViewerDirect] ❌ Error preparing scene:', error);
                setLoadingMessage('Error Loading 3D Model');
            }
        };

        loadScene();
    }, [modelData, clearUnityScene, loadUnityScene]);

    // Reset state when component unmounts or loses focus
    useFocusEffect(
        useCallback(() => {
            return () => {
                console.log('[UnityViewerDirect] Component unfocused, resetting state');
                setShowUnity(false);
                fadeAnim.setValue(1);
            };
        }, [fadeAnim])
    );

    return (
        <View style={[{ flex: 1 }, style]}>
            <UnityView
                ref={unityRef}
                style={{ flex: 1 }}
                onUnityMessage={handleMessage}
                onPlayerReady={() => {
                    console.log('[UnityViewerDirect] 🎮 Unity player ready');
                    setIsPlayerReady(true);
                }}
                onPlayerQuit={() => {
                    console.log('[UnityViewerDirect] Unity player quit');
                    setShowUnity(false);
                    setLoadingMessage('AR Engine Stopped');
                    fadeAnim.setValue(1);
                }}
            />

            {/* Loading overlay - show until Unity is ready */}
            {!showUnity && (
                <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <Text style={styles.loadingText}>Loading AR Experience...</Text>
                        <Text style={styles.loadingSubtext}>{loadingMessage}</Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
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

export default UnityViewerDirect;