// src/screens/MapScreen.js

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, PermissionsAndroid, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapScreen() {
    const [hasLocationPermission, setHasLocationPermission] = useState(Platform.OS === 'ios');

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
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <Marker coordinate={{ latitude: 1.3521, longitude: 103.8198 }} title="Singapore" />
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
