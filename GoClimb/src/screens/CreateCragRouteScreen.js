// GoClimb/src/screens/CreateCragRouteScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { createCrag, createRoute, fetchAllCrag } from '../services/api/CragService';
import * as DocumentPicker from '@react-native-documents/picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GRADE_OPTIONS = [
  { value: 1, label: '4' },
  { value: 2, label: '5' },
  { value: 3, label: '5+' },
  { value: 4, label: '6A' },
  { value: 5, label: '6A+' },
  { value: 6, label: '6B' },
  { value: 7, label: '6B+' },
  { value: 8, label: '6C' },
  { value: 9, label: '6C+' },
  { value: 10, label: '7A' },
  { value: 11, label: '7A+' },
  { value: 12, label: '7B' },
  { value: 13, label: '7B+' },
  { value: 14, label: '7C' },
  { value: 15, label: '7C+' },
  { value: 16, label: '8A' },
  { value: 17, label: '8A+' },
  { value: 18, label: '8B' },
  { value: 19, label: '8B+' },
  { value: 20, label: '8C' },
  { value: 21, label: '8C+' },
  { value: 22, label: '9A' },
];

export default function CreateCragRouteScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('crag'); // 'crag' or 'route'
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const toastRef = useRef(null);

  // Crag form state
  const [cragName, setCragName] = useState('');
  const [cragLocation, setCragLocation] = useState(null); // { latitude, longitude, address }
  const [cragDescription, setCragDescription] = useState('');
  const [cragImages, setCragImages] = useState([]);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Debug: Log cragImages state changes
  useEffect(() => {
    console.log('[STATE] cragImages state changed:', cragImages);
    console.log('[STATE] cragImages length:', cragImages.length);
  }, [cragImages]);

  // Route form state
  const [routeName, setRouteName] = useState('');
  const [routeGrade, setRouteGrade] = useState(6);
  const [selectedCrag, setSelectedCrag] = useState(null);
  const [routeImages, setRouteImages] = useState([]);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showCragPicker, setShowCragPicker] = useState(false);

  // Crags list for route creation
  const [crags, setCrags] = useState([]);
  const [loadingCrags, setLoadingCrags] = useState(false);

  useEffect(() => {
    if (activeTab === 'route') {
      loadCrags();
    }
  }, [activeTab]);

  const loadCrags = async () => {
    setLoadingCrags(true);
    try {
      const result = await fetchAllCrag();
      if (result.success) {
        setCrags(result.crags);
      }
    } catch (error) {
      console.log('Error loading crags:', error);
    }
    setLoadingCrags(false);
  };

  function showToast(msg, durationMs = 2000) {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), durationMs);
  }

  const handlePickImages = async (type) => {
    console.log('[handlePickImages] === FUNCTION CALLED ===');
    console.log('[handlePickImages] type:', type);
    console.log('[handlePickImages] About to check DocumentPicker import...');
    console.log('[handlePickImages] DocumentPicker:', DocumentPicker);
    console.log('[handlePickImages] DocumentPicker.pick:', DocumentPicker.pick);
    console.log('[handlePickImages] Starting DocumentPicker...');
    
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
        allowMultiSelection: true,
        copyTo: 'cachesDirectory',
      });
      
      console.log('[handlePickImages] DocumentPicker completed successfully');

      if (result && result.length > 0) {
        console.log('[handlePickImages] === IMAGE PICKER DEBUG ===');
        console.log('[handlePickImages] type:', type);
        console.log('[handlePickImages] DocumentPicker result:', result);
        console.log('[handlePickImages] result length:', result.length);
        
        const currentImages = type === 'crag' ? cragImages : routeImages;
        const totalImages = currentImages.length + result.length;
        
        console.log('[handlePickImages] currentImages length:', currentImages.length);
        console.log('[handlePickImages] totalImages after adding:', totalImages);
        
        if (totalImages > 5) {
          showToast('Maximum 5 images allowed');
          return;
        }

        // No size limit - accept all images
        console.log('[handlePickImages] ✅ No size limit - all images accepted');

        const newImages = [...currentImages, ...result];
        console.log('[handlePickImages] newImages array:', newImages);

        if (type === 'crag') {
          console.log('[handlePickImages] Setting cragImages to:', newImages);
          setCragImages(newImages);
        } else {
          console.log('[handlePickImages] Setting routeImages to:', newImages);
          setRouteImages(newImages);
        }
        
        console.log('[handlePickImages] === END IMAGE PICKER DEBUG ===');
      }
    } catch (err) {
      console.log('[handlePickImages] === ERROR CAUGHT ===');
      console.log('[handlePickImages] Error:', err);
      console.log('[handlePickImages] Error message:', err.message);
      console.log('[handlePickImages] Is cancel?', DocumentPicker.isCancel(err));
      
      if (!DocumentPicker.isCancel(err)) {
        console.log('[handlePickImages] Showing error toast');
        showToast('Failed to pick images');
      } else {
        console.log('[handlePickImages] User cancelled picker');
      }
    }
  };

  const removeImage = (index, type) => {
    if (type === 'crag') {
      setCragImages(cragImages.filter((_, i) => i !== index));
    } else {
      setRouteImages(routeImages.filter((_, i) => i !== index));
    }
  };

  // Reverse geocoding function using backend location detail API
  const reverseGeocode = async (latitude, longitude) => {
    try {
      // Call your backend's location detail API
      const response = await fetch(`YOUR_BACKEND_URL/location_detail?lat=${latitude}&lon=${longitude}`);
      const locationDetail = await response.json();
      
      console.log('[DEBUG] Backend location detail response:', locationDetail);
      
      if (locationDetail) {
        // Use the formatted_address if available
        if (locationDetail.formatted_address) {
          return locationDetail.formatted_address;
        }
        
        // Otherwise build from components
        const components = [];
        
        // Add district if available
        if (locationDetail.district) components.push(locationDetail.district);
        
        // Add city
        if (locationDetail.city) components.push(locationDetail.city);
        
        // Add state if available and not null
        if (locationDetail.state && locationDetail.state !== null) {
          components.push(locationDetail.state);
        }
        
        // Add country
        if (locationDetail.country) components.push(locationDetail.country);
        
        // Join components with commas
        if (components.length > 0) {
          return components.join(', ');
        }
      }
      
      // Fallback
      return `Selected Location`;
    } catch (error) {
      console.log('Backend location detail error:', error);
      return `Selected Location`;
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    showToast('Getting location details...');
    
    try {
      // Get location details from backend
      const response = await fetch(`YOUR_BACKEND_URL/location_detail?lat=${latitude}&lon=${longitude}`);
      const locationDetail = await response.json();
      
      // Get display address
      const address = locationDetail.formatted_address || 
                     [locationDetail.district, locationDetail.city, locationDetail.country]
                     .filter(Boolean).join(', ') || 
                     'Selected Location';
      
      setCragLocation({
        latitude,
        longitude,
        address,
        location_detail: locationDetail // Store the full location detail for API
      });
    } catch (error) {
      console.log('Error getting location details:', error);
      setCragLocation({
        latitude,
        longitude,
        address: 'Selected Location',
        location_detail: null
      });
    }
  };

  const handleCreateCrag = async () => {
    if (!cragName.trim()) {
      showToast('Please enter a crag name');
      return;
    }

    if (!cragLocation) {
      showToast('Please select a location on the map');
      return;
    }

    setSubmitting(true);

    const { latitude: lat, longitude: lon } = cragLocation;

    // Debug logging for crag creation
    console.log('[CreateCragRouteScreen] === CRAG CREATION DEBUG ===');
    console.log('[CreateCragRouteScreen] user:', user);
    console.log('[CreateCragRouteScreen] user.uid:', user?.uid);
    console.log('[CreateCragRouteScreen] cragImages state:', cragImages);
    console.log('[CreateCragRouteScreen] cragImages length:', cragImages.length);
    console.log('[CreateCragRouteScreen] cragImages content:', JSON.stringify(cragImages, null, 2));

    try {
      const result = await createCrag({
        name: cragName.trim(),
        location_lat: lat,
        location_lon: lon,
        location_detail: cragLocation.location_detail, // Add location detail from backend
        description: cragDescription.trim(),
        images: cragImages, // Pass images
        user_id: user?.uid, // Add user ID
      });

      if (result.success) {
        console.log('[CreateCragRouteScreen] Crag created successfully, showing alert');
        try {
          Alert.alert(
            'Success', 
            'Crag created successfully!',
            [{ text: 'OK', style: 'default' }],
            { cancelable: false }
          );
          // Reset form
          setCragName('');
          setCragLocation(null);
          setCragDescription('');
          setCragImages([]);
          console.log('[CreateCragRouteScreen] Form reset completed');
        } catch (alertError) {
          console.log('[CreateCragRouteScreen] Error in alert or form reset:', alertError);
          showToast('Crag created successfully!'); // Fallback to toast
        }
      } else {
        showToast(result.message || 'Failed to create crag');
      }
    } catch (error) {
      console.log('[CreateCragRouteScreen] Error in crag creation:', error);
      showToast('An error occurred while creating the crag');
    }

    setSubmitting(false);
  };

  const handleCreateRoute = async () => {
    if (!routeName.trim()) {
      showToast('Please enter a route name');
      return;
    }

    if (!selectedCrag) {
      showToast('Please select a crag');
      return;
    }

    setSubmitting(true);

    // Debug logging
    console.log('[CreateCragRouteScreen] routeImages before API call:', routeImages);
    console.log('[CreateCragRouteScreen] routeImages length:', routeImages.length);
    console.log('[CreateCragRouteScreen] routeImages content:', JSON.stringify(routeImages, null, 2));

    try {
      const result = await createRoute({
        crag_id: selectedCrag.crag_id || selectedCrag.crag_pretty_id,
        route_name: routeName.trim(),
        route_grade: routeGrade,
        images: routeImages, // Pass images
        user_id: user?.uid, // Add user ID
      });

      if (result.success) {
        console.log('[CreateCragRouteScreen] Route created successfully, showing alert');
        try {
          Alert.alert(
            'Success', 
            'Route created successfully!',
            [{ text: 'OK', style: 'default' }],
            { cancelable: false }
          );
          // Reset form
          setRouteName('');
          setRouteGrade(6);
          setSelectedCrag(null);
          setRouteImages([]);
          console.log('[CreateCragRouteScreen] Form reset completed');
        } catch (alertError) {
          console.log('[CreateCragRouteScreen] Error in alert or form reset:', alertError);
          showToast('Route created successfully!'); // Fallback to toast
        }
      } else {
        showToast(result.message || 'Failed to create route');
      }
    } catch (error) {
      console.log('[CreateCragRouteScreen] Error in route creation:', error);
      showToast('An error occurred while creating the route');
    }

    setSubmitting(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('MainTabs', { screen: 'Routes' });
          }
        }} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create New</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Toast */}
      {toast ? (
        <View style={[styles.toast, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{toast}</Text>
        </View>
      ) : null}

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'crag' && styles.activeTab]}
          onPress={() => setActiveTab('crag')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'crag' ? colors.accent : colors.textDim }]}>
            Crag
          </Text>
          {activeTab === 'crag' && <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'route' && styles.activeTab]}
          onPress={() => setActiveTab('route')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'route' ? colors.accent : colors.textDim }]}>
            Route
          </Text>
          {activeTab === 'route' && <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'crag' ? (
          // Crag Form
          <View>
            <Text style={[styles.label, { color: colors.text }]}>Crag Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
              placeholder="Enter crag name"
              placeholderTextColor={colors.textDim}
              value={cragName}
              onChangeText={setCragName}
            />

            <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
            <TouchableOpacity
              style={[styles.locationPicker, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => setShowMapPicker(true)}
            >
              <View style={{ flex: 1 }}>
                {cragLocation ? (
                  <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={2}>
                    {cragLocation.address}
                  </Text>
                ) : (
                  <Text style={[styles.locationPlaceholder, { color: colors.textDim }]}>
                    Tap to select location on map
                  </Text>
                )}
              </View>
              <Ionicons name="location-outline" size={24} color={colors.accent} />
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
              placeholder="Enter crag description"
              placeholderTextColor={colors.textDim}
              value={cragDescription}
              onChangeText={setCragDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={[styles.label, { color: colors.text }]}>Images (optional, max 5)</Text>
            <TouchableOpacity
              style={[styles.addImageButton, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => {
                console.log('[BUTTON] Add Images button pressed for crag');
                handlePickImages('crag');
              }}
              disabled={cragImages.length >= 5}
            >
              <Ionicons
                name="images-outline"
                size={24}
                color={cragImages.length >= 5 ? colors.textDim : colors.accent}
              />
              <Text style={[styles.addImageButtonText, { color: cragImages.length >= 5 ? colors.textDim : colors.text }]}>
                {cragImages.length >= 5 ? 'Maximum images reached' : 'Add Images'}
              </Text>
            </TouchableOpacity>

            {cragImages.length > 0 && (
              <View style={styles.imagesPreviewContainer}>
                <FlatList
                  data={cragImages}
                  horizontal
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={styles.imagePreviewWrapper}>
                      <Image source={{ uri: item.uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={[styles.removeImageButton, { backgroundColor: colors.surface }]}
                        onPress={() => removeImage(index, 'crag')}
                      >
                        <Ionicons name="close" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.accent }]}
              onPress={handleCreateCrag}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Crag</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Route Form
          <View>
            <Text style={[styles.label, { color: colors.text }]}>Route Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
              placeholder="Enter route name"
              placeholderTextColor={colors.textDim}
              value={routeName}
              onChangeText={setRouteName}
            />

            <Text style={[styles.label, { color: colors.text }]}>Crag *</Text>
            <TouchableOpacity
              style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => setShowCragPicker(!showCragPicker)}
            >
              <Text style={[styles.pickerText, { color: selectedCrag ? colors.text : colors.textDim }]}>
                {selectedCrag ? selectedCrag.name : 'Select a crag'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textDim} />
            </TouchableOpacity>

            {showCragPicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                {loadingCrags ? (
                  <ActivityIndicator color={colors.accent} style={{ padding: 20 }} />
                ) : crags.length === 0 ? (
                  <Text style={[styles.pickerEmpty, { color: colors.textDim }]}>No crags available</Text>
                ) : (
                  <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                    {crags.map((crag) => (
                      <TouchableOpacity
                        key={crag.crag_id || crag.crag_pretty_id}
                        style={[styles.pickerItem, { borderBottomColor: colors.divider }]}
                        onPress={() => {
                          setSelectedCrag(crag);
                          setShowCragPicker(false);
                        }}
                      >
                        <Text style={[styles.pickerItemText, { color: colors.text }]}>{crag.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Grade *</Text>
            <TouchableOpacity
              style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => setShowGradePicker(!showGradePicker)}
            >
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {GRADE_OPTIONS.find(g => g.value === routeGrade)?.label || '6B'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textDim} />
            </TouchableOpacity>

            {showGradePicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {GRADE_OPTIONS.map((grade) => (
                    <TouchableOpacity
                      key={grade.value}
                      style={[styles.pickerItem, { borderBottomColor: colors.divider }]}
                      onPress={() => {
                        setRouteGrade(grade.value);
                        setShowGradePicker(false);
                      }}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.text }]}>{grade.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Images (optional, max 5)</Text>
            <TouchableOpacity
              style={[styles.addImageButton, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => handlePickImages('route')}
              disabled={routeImages.length >= 5}
            >
              <Ionicons
                name="images-outline"
                size={24}
                color={routeImages.length >= 5 ? colors.textDim : colors.accent}
              />
              <Text style={[styles.addImageButtonText, { color: routeImages.length >= 5 ? colors.textDim : colors.text }]}>
                {routeImages.length >= 5 ? 'Maximum images reached' : 'Add Images'}
              </Text>
            </TouchableOpacity>

            {routeImages.length > 0 && (
              <View style={styles.imagesPreviewContainer}>
                <FlatList
                  data={routeImages}
                  horizontal
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={styles.imagePreviewWrapper}>
                      <Image source={{ uri: item.uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={[styles.removeImageButton, { backgroundColor: colors.surface }]}
                        onPress={() => removeImage(index, 'route')}
                      >
                        <Ionicons name="close" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.accent }]}
              onPress={handleCreateRoute}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Route</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Map Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.mapModalContainer, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
          {/* Map Modal Header */}
          <View style={[styles.mapModalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
            <TouchableOpacity onPress={() => setShowMapPicker(false)} style={styles.mapModalButton}>
              <Text style={[styles.mapModalButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.mapModalTitle, { color: colors.text }]}>Select Location</Text>
            <TouchableOpacity 
              onPress={() => {
                if (cragLocation) {
                  setShowMapPicker(false);
                } else {
                  showToast('Please tap on the map to select a location');
                }
              }} 
              style={styles.mapModalButton}
            >
              <Text style={[styles.mapModalButtonText, { color: cragLocation ? colors.accent : colors.textDim }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={[styles.mapInstructions, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
            <Text style={[styles.mapInstructionsText, { color: colors.textDim }]}>
              Tap anywhere on the map to select the crag location
            </Text>
          </View>

          {/* Map */}
          <MapView
            style={styles.mapPicker}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: 1.3521, // Singapore as default
              longitude: 103.8198,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            }}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {cragLocation && (
              <Marker
                coordinate={{
                  latitude: cragLocation.latitude,
                  longitude: cragLocation.longitude,
                }}
                title="Selected Location"
                description={cragLocation.address}
              >
                <View style={styles.selectedMarker}>
                  <View style={styles.selectedMarkerInner}>
                    <Text style={styles.selectedMarkerText}>🪨</Text>
                  </View>
                  <View style={styles.selectedMarkerArrow} />
                </View>
              </Marker>
            )}
          </MapView>

          {/* Selected Location Info */}
          {cragLocation && (
            <View style={[styles.selectedLocationInfo, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
              <View style={styles.selectedLocationContent}>
                <Ionicons name="location" size={24} color={colors.accent} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.selectedLocationAddress, { color: colors.text }]} numberOfLines={2}>
                    {cragLocation.address}
                  </Text>
                  <Text style={[styles.selectedLocationCoords, { color: colors.textDim }]}>
                    {cragLocation.latitude.toFixed(6)}, {cragLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 15,
  },
  pickerDropdown: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerItemText: {
    fontSize: 15,
  },
  pickerEmpty: {
    padding: 20,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addImageButtonText: {
    fontSize: 14,
    marginLeft: 8,
  },
  imagesPreviewContainer: {
    marginTop: 12,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // Location picker styles
  locationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 50,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '500',
  },
  locationCoords: {
    fontSize: 12,
    marginTop: 2,
  },
  locationPlaceholder: {
    fontSize: 15,
  },
  // Map modal styles
  mapModalContainer: {
    flex: 1,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mapModalButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  mapModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  mapInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mapInstructionsText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  mapPicker: {
    flex: 1,
  },
  selectedMarker: {
    alignItems: 'center',
  },
  selectedMarkerInner: {
    backgroundColor: '#4CAF50',
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
  selectedMarkerText: {
    fontSize: 20,
  },
  selectedMarkerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#4CAF50',
    marginTop: -2,
  },
  selectedLocationInfo: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  selectedLocationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selectedLocationAddress: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedLocationCoords: {
    fontSize: 12,
  },
});
