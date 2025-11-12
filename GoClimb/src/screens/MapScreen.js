// src/screens/MapScreen.js

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, PermissionsAndroid, Platform, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapView from 'react-native-map-clustering';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchAllCragsBootstrap, fetchRoutesByCragIdGET } from '../services/api/CragService';
import { convertNumericGradeToFont } from '../utils/gradeConverter';
import { useTheme } from '../context/ThemeContext';

export default function MapScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [hasLocationPermission, setHasLocationPermission] = useState(Platform.OS === 'ios');
    const [crags, setCrags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCrag, setSelectedCrag] = useState(null);
    const [cragRoutes, setCragRoutes] = useState([]);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

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

    const handleMarkerPress = async (crag) => {
        console.log('[MapScreen] Marker pressed:', crag.name);
        setSelectedCrag(crag);
        setLoadingRoutes(true);
        setCragRoutes([]);

        try {
            const cragIdToUse = crag.crag_pretty_id || crag.crag_pk;
            const { success, routes } = await fetchRoutesByCragIdGET(cragIdToUse);
            
            if (success && routes) {
                setCragRoutes(routes);
            }
        } catch (error) {
            console.log('[MapScreen] Error loading routes:', error);
        }
        
        setLoadingRoutes(false);
    };

    const handleSeeAllRoutes = () => {
        if (!selectedCrag) return;
        
        // Navigate to Routes tab (which is CragsScreen) and pass the crag to auto-expand
        navigation.navigate('MainTabs', {
            screen: 'Routes',
            params: {
                expandCragId: selectedCrag.crag_pk,
            },
        });
        
        setSelectedCrag(null);
    };

    const calculateAverageGrade = (routes) => {
        if (!routes || routes.length === 0) return '—';
        
        const grades = routes
            .map(route => {
                const gradeRaw = route.route_grade || route.grade || route.gradeRaw;
                return Number(gradeRaw);
            })
            .filter(grade => !isNaN(grade) && grade > 0);
        
        if (grades.length === 0) return '—';
        
        const sum = grades.reduce((acc, grade) => acc + grade, 0);
        const avg = sum / grades.length;
        const roundedDown = Math.floor(avg);
        
        return convertNumericGradeToFont(roundedDown);
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

            {/* Crag Info Card */}
            {selectedCrag && (
                <View style={[styles.cragInfoCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                    <View style={styles.cragInfoHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cragInfoTitle, { color: colors.text }]}>
                                {selectedCrag.name}
                            </Text>
                            <Text style={[styles.cragInfoSubtitle, { color: colors.textDim }]}>
                                {selectedCrag.country || 'Climbing Crag'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setSelectedCrag(null)}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {loadingRoutes ? (
                        <View style={styles.cragInfoLoading}>
                            <ActivityIndicator color={colors.accent} />
                            <Text style={[styles.cragInfoLoadingText, { color: colors.textDim }]}>
                                Loading routes...
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.cragInfoStats}>
                                <View style={styles.statItem}>
                                    <Ionicons name="trail-sign" size={20} color={colors.accent} />
                                    <Text style={[styles.statValue, { color: colors.text }]}>
                                        {cragRoutes.length}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: colors.textDim }]}>
                                        {cragRoutes.length === 1 ? 'Route' : 'Routes'}
                                    </Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Ionicons name="stats-chart" size={20} color={colors.accent} />
                                    <Text style={[styles.statValue, { color: colors.text }]}>
                                        {calculateAverageGrade(cragRoutes)}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: colors.textDim }]}>
                                        Avg. Grade
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.seeAllButton, { backgroundColor: colors.accent }]}
                                onPress={handleSeeAllRoutes}
                            >
                                <Text style={styles.seeAllButtonText}>See All Routes</Text>
                                <Ionicons name="arrow-forward" size={18} color="white" />
                            </TouchableOpacity>
                        </>
                    )}
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
    // Crag info card styles
    cragInfoCard: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cragInfoHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cragInfoTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    cragInfoSubtitle: {
        fontSize: 14,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
    cragInfoLoading: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    cragInfoLoadingText: {
        marginTop: 8,
        fontSize: 14,
    },
    cragInfoStats: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 16,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    seeAllButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
