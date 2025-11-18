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

    const handleMessage = useCallback(async (result) => {
        const message = result.nativeEvent.message;

        try {
            if (message === 'UNITY_READY') {
                setLoadingMessage('AR Ready!');
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
                setLoadingMessage('AR Engine Error');
                Alert.alert('AR Error', message.includes(':') ? message.split(':')[1] : 'Unknown error');
                return;
            }

            try {
                const routeData = JSON.parse(message);
                if (routeData.route_name && routeData.points && autoSaveRouteData) {
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

            if (onUnityMessage) onUnityMessage(message);

        } catch (error) {
            console.error('[UnityViewerDirect] Message error:', error);
        }
    }, [onUnityReady, onUnityMessage, autoSaveRouteData, modelId, cragId, fadeAnim]);

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

    const loadUnityScene = useCallback(async (sceneData) => {
        clearUnityScene();
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = sendToUnity('UnityReceiver', 'LoadIndoorScene', JSON.stringify(sceneData));
                resolve(success);
            }, 1000);
        });
    }, [sendToUnity, clearUnityScene]);

    const loadOutdoorScene = useCallback(async (sceneData = "") => {
        clearUnityScene();
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = sendToUnity('UnityReceiver', 'LoadOutdoorScene', sceneData);
                resolve(success);
            }, 1000);
        });
    }, [sendToUnity, clearUnityScene]);

    useEffect(() => {
        if (!modelData?.path) return;

        setLoadingMessage('Preparing 3D Model...');

        const findModelFileRecursively = async (dirPath, maxDepth = 5, currentDepth = 0) => {
            if (currentDepth >= maxDepth) return null;
            
            try {
                const items = await RNFS.readDir(dirPath);
                
                const modelFile = items.find(item => 
                    !item.isDirectory() && 
                    (item.name.toLowerCase().endsWith('.glb') || 
                     item.name.toLowerCase().endsWith('.gltf'))
                );
                
                if (modelFile) {
                    return modelFile.path;
                }
                
                for (const item of items) {
                    if (item.isDirectory()) {
                        const foundPath = await findModelFileRecursively(item.path, maxDepth, currentDepth + 1);
                        if (foundPath) {
                            return foundPath;
                        }
                    }
                }
                
                return null;
            } catch (error) {
                return null;
            }
        };

        const loadScene = async () => {
            try {
                let glbPath = modelData.path;
                if (!glbPath.toLowerCase().endsWith('.glb') && !glbPath.toLowerCase().endsWith('.gltf')) {
                    setLoadingMessage('Searching for 3D Model...');
                    glbPath = await findModelFileRecursively(modelData.path);
                    if (!glbPath) {
                        setLoadingMessage('3D Model Not Found');
                        Alert.alert(
                            'Model Not Found',
                            'No .glb or .gltf model file found in the selected folder or its subfolders.'
                        );
                        return;
                    }
                }

                const sceneData = {
                    path: glbPath,
                    normalizationJson: modelData.normalizationJson || {
                        scale: 0.001,
                        pos_offset: { x: 0, y: 0, z: 0 },
                        rot_offset: { x: 90, y: 0, z: 0 }
                    },
                    routeJson: modelData.routeJson || []
                };

                setLoadingMessage('Starting AR Engine...');
                setTimeout(async () => {
                    clearUnityScene();
                    setTimeout(() => {
                        setLoadingMessage('Loading 3D Model...');
                        loadUnityScene(sceneData);
                    }, 200);
                }, 3000);

            } catch (error) {
                setLoadingMessage('Error Loading 3D Model');
            }
        };

        loadScene();
    }, [modelData, clearUnityScene, loadUnityScene]);

    useFocusEffect(
        useCallback(() => {
            clearUnityScene()
            return () => {
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
                onPlayerQuit={() => {
                    setShowUnity(false);
                    setLoadingMessage('AR Engine Stopped');
                    fadeAnim.setValue(1);
                }}
            />


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