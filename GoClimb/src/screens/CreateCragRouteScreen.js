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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { createCrag, createRoute, fetchAllCrag } from '../services/api/CragService';
import * as DocumentPicker from '@react-native-documents/picker';

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
  
  const [activeTab, setActiveTab] = useState('crag'); // 'crag' or 'route'
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const toastRef = useRef(null);

  // Crag form state
  const [cragName, setCragName] = useState('');
  const [cragLat, setCragLat] = useState('');
  const [cragLon, setCragLon] = useState('');
  const [cragDescription, setCragDescription] = useState('');
  const [cragImages, setCragImages] = useState([]);

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
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
        allowMultiSelection: true,
        copyTo: 'cachesDirectory',
      });

      if (result && result.length > 0) {
        const currentImages = type === 'crag' ? cragImages : routeImages;
        const totalImages = currentImages.length + result.length;
        
        if (totalImages > 5) {
          showToast('Maximum 5 images allowed');
          return;
        }

        for (const file of result) {
          if (file.size && file.size > 5 * 1024 * 1024) {
            showToast('Each image must be less than 5MB');
            return;
          }
        }

        if (type === 'crag') {
          setCragImages([...cragImages, ...result]);
        } else {
          setRouteImages([...routeImages, ...result]);
        }
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        showToast('Failed to pick images');
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

  const handleCreateCrag = async () => {
    if (!cragName.trim()) {
      showToast('Please enter a crag name');
      return;
    }

    if (!cragLat || !cragLon) {
      showToast('Please enter latitude and longitude');
      return;
    }

    const lat = parseFloat(cragLat);
    const lon = parseFloat(cragLon);

    if (isNaN(lat) || isNaN(lon)) {
      showToast('Invalid coordinates');
      return;
    }

    setSubmitting(true);

    try {
      const result = await createCrag({
        name: cragName.trim(),
        location_lat: lat,
        location_lon: lon,
        description: cragDescription.trim(),
        images: cragImages, // Pass images
      });

      if (result.success) {
        showToast('Crag created successfully!', 1500);
        // Reset form
        setCragName('');
        setCragLat('');
        setCragLon('');
        setCragDescription('');
        setCragImages([]);
        setTimeout(() => {
          // Navigate to MainTabs -> Routes (which is CragsScreen) with refresh
          navigation.navigate('MainTabs', {
            screen: 'Routes',
            params: { refresh: true, expandCragId: result.crag?.crag_pk }
          });
        }, 1500);
      } else {
        showToast(result.message || 'Failed to create crag');
      }
    } catch (error) {
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

    try {
      const result = await createRoute({
        crag_id: selectedCrag.crag_id || selectedCrag.crag_pretty_id,
        route_name: routeName.trim(),
        route_grade: routeGrade,
        images: routeImages, // Pass images
      });

      if (result.success) {
        showToast('Route created successfully!', 1500);
        const cragPk = selectedCrag?.crag_pk;
        // Reset form
        setRouteName('');
        setRouteGrade(6);
        setSelectedCrag(null);
        setRouteImages([]);
        setTimeout(() => {
          // Navigate to MainTabs -> Routes (which is CragsScreen) with refresh
          navigation.navigate('MainTabs', {
            screen: 'Routes',
            params: { refresh: true, expandCragId: cragPk }
          });
        }, 1500);
      } else {
        showToast(result.message || 'Failed to create route');
      }
    } catch (error) {
      showToast('An error occurred while creating the route');
    }

    setSubmitting(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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

            <Text style={[styles.label, { color: colors.text }]}>Latitude *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
              placeholder="e.g. 40.7128"
              placeholderTextColor={colors.textDim}
              value={cragLat}
              onChangeText={setCragLat}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: colors.text }]}>Longitude *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
              placeholder="e.g. -74.0060"
              placeholderTextColor={colors.textDim}
              value={cragLon}
              onChangeText={setCragLon}
              keyboardType="numeric"
            />

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
              onPress={() => handlePickImages('crag')}
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
});
