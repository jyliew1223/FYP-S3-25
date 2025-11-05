// src/screens/MapScreen.js

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, PermissionsAndroid, Platform, ActivityIndicator, Text } from 'react-native';
import { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapView from 'react-native-map-clustering';
import { useNavigation } from '@react-navigation/native';
import { fetchAllCragsBootstrap } from '../services/api/CragService';

export default function MapScreen() {
    const navigation = useNavigation();
    const [hasLocationPermission, setHasLocationPermission] = useState(Platform.OS === 'ios');
    const [crags, setCrags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const requestLocationPermission = async () => {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                setHasLocationPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
            }
        };

        requestLocationPermission();
    }, []);

    useEffect(() => {
        const loadCrags = async () => {
            setLoading(true);
            try {
                const cragsList = await fetchAllCragsBootstrap();
                console.log('[MapScreen] Loaded crags:', cragsList);
                setCrags(cragsList);
            } catch (error) {
                console.log('[MapScreen] Error loading crags:', error);
            }
            setLoading(false);
        };

        loadCrags();
    }, []);

    const handleMarkerPress = (crag) => {
        console.log('[MapScreen] Marker pressed:', crag.name);
        // Navigate to crag details or show info
        navigation.navigate('Crags');
    };

    const renderCluster = (cluster) => {
        const { id, geometry, onPress, properties } = cluster;
        const points = properties.point_count;

        return (
            <Marker
                key={`cluster-${id}`}
                coordinate={{
                    latitude: geometry.coordinates[1],
                    longitude: geometry.coordinates[0],
                }}
                onPress={onPress}
            >
                <View style={styles.clusterContainer}>
                    <View style={styles.clusterBubble}>
                        <Text style={styles.clusterText}>{points}</Text>
                    </View>
                </View>
            </Marker>
        );
    };

    return (
        <View style={styles.container}>
            <MapView
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_GOOGLE}
                showsUserLocation={hasLocationPermission}
                showsMyLocationButton={hasLocationPermission}
                initialRegion={{
                    latitude: 1.3521,
                    longitude: 103.8198,
                    latitudeDelta: 0.5,
                    longitudeDelta: 0.5,
                }}
                clusterColor="#FF6B6B"
                clusterTextColor="#FFFFFF"
                clusterFontFamily="System"
                radius={50}
                renderCluster={renderCluster}
            >
                {crags.map((crag) => {
                    // Extract lat/lon from the crag data
                    const lat = crag.location_lat || crag.locationLat;
                    const lon = crag.location_lon || crag.locationLon;
                    
                    if (!lat || !lon) {
                        console.log('[MapScreen] Skipping crag without coordinates:', crag.name);
                        return null;
                    }

                    return (
                        <Marker
                            key={crag.crag_pretty_id || crag.crag_pk}
                            coordinate={{
                                latitude: lat,
                                longitude: lon,
                            }}
                            title={crag.name}
                            description={crag.country || 'Climbing crag'}
                            onPress={() => handleMarkerPress(crag)}
                        >
                            <View style={styles.markerContainer}>
                                <View style={styles.markerBubble}>
                                    <Text style={styles.markerText}>🧗</Text>
                                </View>
                                <View style={styles.markerArrow} />
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text style={styles.loadingText}>Loading crags...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Cluster styles
    clusterContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    clusterBubble: {
        backgroundColor: '#FF6B6B',
        borderRadius: 25,
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    clusterText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    // Individual marker styles
    markerContainer: {
        alignItems: 'center',
    },
    markerBubble: {
        backgroundColor: '#4A90E2',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    markerText: {
        fontSize: 20,
    },
    markerArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#4A90E2',
        marginTop: -2,
    },
});
