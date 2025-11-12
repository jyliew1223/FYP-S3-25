// GoClimb/src/screens/ModelManagementScreen.js

import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { fetchCragByUserId, deleteModel, UploadModel, updateModel } from '../services/api/ModelService';
import { fetchAllCrag } from '../services/api/CragService';
import { pick, types } from '@react-native-documents/picker';
import { downloadFolderFromJson } from '../services/firebase/FileDownloadHelper';
import { findCragFolder } from '../utils/LocalModelChecker';

export default function ModelManagementScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  // Edit related states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [editModelName, setEditModelName] = useState('');
  const [editNormalizationData, setEditNormalizationData] = useState({
    scale: '0.001',
    pos_offset_x: '0',
    pos_offset_y: '0',
    pos_offset_z: '0',
    rot_offset_x: '90',
    rot_offset_y: '0',
    rot_offset_z: '0'
  });

  // Upload related states
  const [crags, setCrags] = useState([]);
  const [selectedZipFile, setSelectedZipFile] = useState(null);
  const [showCragSelection, setShowCragSelection] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [modelName, setModelName] = useState('');
  const [selectedCragForUpload, setSelectedCragForUpload] = useState(null);
  const [normalizationData, setNormalizationData] = useState({
    scale: '0.001',
    pos_offset_x: '0',
    pos_offset_y: '0',
    pos_offset_z: '0',
    rot_offset_x: '90',
    rot_offset_y: '0',
    rot_offset_z: '0'
  });

  const loadModels = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetchCragByUserId();

      if (response.success) {
        const modelsWithAvailability = await checkLocalAvailability(response.data || []);
        setModels(modelsWithAvailability);
      } else {
        Alert.alert('Error', response.message || 'Failed to load models');
        setModels([]);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      Alert.alert('Error', 'Failed to load models');
      setModels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleDeleteModel = async (modelId, modelName) => {
    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete "${modelName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingIds(prev => new Set([...prev, modelId]));

            try {
              console.log('Attempting to delete model with ID:', modelId);
              const response = await deleteModel(modelId);
              console.log('Delete response:', response);

              if (response?.success) {
                setModels(prev => prev.filter(model => model.model_id !== modelId));
              } else {
                Alert.alert('Error', response?.message || 'Failed to delete model');
              }
            } catch (error) {
              console.error('Error deleting model:', error);
              Alert.alert('Error', 'Failed to delete model');
            } finally {
              setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(modelId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Home' });
    }
  };

  const onRefresh = () => {
    loadModels(true);
  };

  // Load crags for upload functionality
  const loadCrags = useCallback(async () => {
    try {
      const result = await fetchAllCrag();
      setCrags(result.success ? result.crags : []);
    } catch (error) {
      console.error('Error loading crags:', error);
      setCrags([]);
    }
  }, []);

  useEffect(() => {
    loadCrags();
  }, [loadCrags]);

  // Check if storage permissions are already granted
  const checkStoragePermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const apiLevel = Platform.Version;
      
      // For Android 13+ (API 33+), check granular media permissions
      if (apiLevel >= 33) {
        const permissions = [
          'android.permission.READ_MEDIA_IMAGES',
          'android.permission.READ_MEDIA_VIDEO',
          'android.permission.READ_MEDIA_AUDIO',
        ];

        const results = await Promise.all(
          permissions.map(permission => PermissionsAndroid.check(permission))
        );

        // Return true if at least one media permission is granted
        return results.some(result => result === true);
      }
      // For Android 11-12 (API 30-32)
      else if (apiLevel >= 30) {
        return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }
      // For older Android versions
      else {
        const readGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        const writeGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        return readGranted && writeGranted;
      }
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }, []);

  // Request storage permissions (only if not already granted)
  const requestStoragePermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;

    try {
      // First check if we already have permissions to avoid unnecessary requests
      const hasExistingPermission = await checkStoragePermission();
      if (hasExistingPermission) {
        return true;
      }

      const apiLevel = Platform.Version;
      
      // For Android 13+ (API 33+), request granular media permissions
      if (apiLevel >= 33) {
        const permissions = [
          'android.permission.READ_MEDIA_IMAGES',
          'android.permission.READ_MEDIA_VIDEO',
          'android.permission.READ_MEDIA_AUDIO',
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        // Check if at least one media permission was granted
        return Object.values(granted).some(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      }
      // For Android 11-12 (API 30-32)
      else if (apiLevel >= 30) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      // For older Android versions
      else {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);

        const readGranted = granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
        const writeGranted = granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;

        return readGranted && writeGranted;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }, [checkStoragePermission]);

  const handleDocumentPicker = useCallback(async () => {
    try {
      // For Android versions below 13, handle permissions
      // Android 13+ uses scoped storage and doesn't need explicit permissions for document picker
      if (Platform.OS === 'android' && Platform.Version < 33) {
        // First check if we already have permission
        const hasExistingPermission = await checkStoragePermission();
        
        if (!hasExistingPermission) {
          // Only request permission if we don't have it
          const hasPermission = await requestStoragePermission();

          if (!hasPermission) {
            Alert.alert(
              'Permission Required',
              'File access permission is needed to upload models. You can still try to select a file as the system picker may work without additional permissions.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Try Anyway', style: 'default' }
              ]
            );
            // Continue anyway - document picker might still work with scoped storage
          }
        }
      }

      const result = await pick({
        type: [types.allFiles],
        allowMultiSelection: false,
        copyTo: 'cachesDirectory', // Helps with Android 15 compatibility
      });

      if (result && result.length > 0) {
        const file = result[0];
        const isZipFile = file.name.toLowerCase().endsWith('.zip') ||
          file.type === 'application/zip' ||
          file.type === 'application/x-zip-compressed';

        if (isZipFile) {
          setSelectedZipFile(file);
          setTimeout(() => {
            setShowCragSelection(true);
          }, 500);
        } else {
          Alert.alert(
            'Invalid File Type',
            'Please select a ZIP file containing your 3D model and textures.'
          );
        }
      }

    } catch (error) {
      if (error.code !== 'DOCUMENT_PICKER_CANCELED') {
        console.error('Document picker error:', error);
        Alert.alert(
          'Error', 
          'Failed to open file picker. Please try again or select the file from a different location.'
        );
      }
    }
  }, [checkStoragePermission, requestStoragePermission]);

  const handleCragSelectionCancel = useCallback(() => {
    setShowCragSelection(false);
    setSelectedZipFile(null);
  }, []);

  const handleCragSelectedForUpload = useCallback((crag) => {
    setShowCragSelection(false);
    setSelectedCragForUpload(crag);
    const defaultName = selectedZipFile.name.replace(/\.[^/.]+$/, '') || `Model for ${crag.name}`;
    setModelName(defaultName);
    setShowNameInput(true);
  }, [selectedZipFile]);

  const resetUploadState = useCallback(() => {
    setShowNameInput(false);
    setSelectedCragForUpload(null);
    setModelName('');
    setSelectedZipFile(null);
    setNormalizationData({
      scale: '0.001',
      pos_offset_x: '0',
      pos_offset_y: '0',
      pos_offset_z: '0',
      rot_offset_x: '90',
      rot_offset_y: '0',
      rot_offset_z: '0'
    });
  }, []);

  const handleNameInputCancel = useCallback(() => {
    resetUploadState();
  }, [resetUploadState]);

  const handleNameInputConfirm = useCallback(async () => {
    if (!modelName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a valid model name.');
      return;
    }

    setShowNameInput(false);

    try {
      Alert.alert(
        'Uploading...',
        `Uploading "${modelName}" to "${selectedCragForUpload.name}"\n\nPlease wait...`
      );

      const normalizationDataObj = {
        scale: parseFloat(normalizationData.scale) || 0.001,
        pos_offset: {
          x: parseFloat(normalizationData.pos_offset_x) || 0,
          y: parseFloat(normalizationData.pos_offset_y) || 0,
          z: parseFloat(normalizationData.pos_offset_z) || 0
        },
        rot_offset: {
          x: parseFloat(normalizationData.rot_offset_x) || 90,
          y: parseFloat(normalizationData.rot_offset_y) || 0,
          z: parseFloat(normalizationData.rot_offset_z) || 0
        }
      };

      const modelData = {
        name: modelName.trim(),
        status: 'active',
        uploadType: 'zip_file',
        normalization_data: normalizationDataObj
      };

      const result = await UploadModel(
        selectedCragForUpload.crag_id || selectedCragForUpload.crag_pretty_id,
        modelData,
        selectedZipFile
      );

      if (result.success) {
        Alert.alert(
          'Upload Successful! 🎉',
          `"${modelName}" has been uploaded to "${selectedCragForUpload.name}" successfully!`
        );
        // Refresh the models list
        loadModels();
      } else {
        Alert.alert(
          'Upload Failed',
          result.message || 'Failed to upload the ZIP file. Please try again.'
        );
      }

    } catch (error) {
      Alert.alert(
        'Upload Error',
        'An error occurred while uploading the file. Please check your connection and try again.'
      );
    } finally {
      resetUploadState();
    }
  }, [modelName, selectedCragForUpload, selectedZipFile, resetUploadState, loadModels]);

  const getLocationText = useCallback((item) => {
    const { city, country } = item.location_details || {};
    return (city && country) ? `${city}, ${country}` :
      country || city || item.country || 'Unknown Location';
  }, []);

  // Unity IndoorScene functionality
  const handleOpenUnityIndoor = useCallback((model) => {
    if (!model.isAvailable || !model.localPath) {
      Alert.alert('Model Not Available', 'Please download the model first to use Unity IndoorScene.');
      return;
    }

    const modelData = {
      path: model.localPath,
      normalizationJson: model.normalization_data || {
        scale: 0.001,
        pos_offset: { x: 0, y: 0, z: 0 },
        rot_offset: { x: 90, y: 0, z: 0 }
      },
      routeJson: []
    };

    navigation.navigate('UnityAR', {
      modelData: modelData,
      cragId: model.crag?.crag_id || 'unknown',
      modelId: model.model_id,
      isIndoorScene: true
    });
  }, [navigation]);

  // Edit functionality
  const handleEditModel = useCallback((model) => {
    setEditingModel(model);
    setEditModelName(model.name || '');

    // Set normalization data from model or use defaults
    const normData = model.normalization_data || {};
    setEditNormalizationData({
      scale: normData.scale?.toString() || '0.001',
      pos_offset_x: normData.pos_offset?.x?.toString() || '0',
      pos_offset_y: normData.pos_offset?.y?.toString() || '0',
      pos_offset_z: normData.pos_offset?.z?.toString() || '0',
      rot_offset_x: normData.rot_offset?.x?.toString() || '90',
      rot_offset_y: normData.rot_offset?.y?.toString() || '0',
      rot_offset_z: normData.rot_offset?.z?.toString() || '0'
    });

    setShowEditModal(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setShowEditModal(false);
    setEditingModel(null);
    setEditModelName('');
    setEditNormalizationData({
      scale: '0.001',
      pos_offset_x: '0',
      pos_offset_y: '0',
      pos_offset_z: '0',
      rot_offset_x: '90',
      rot_offset_y: '0',
      rot_offset_z: '0'
    });
  }, []);

  const handleEditConfirm = useCallback(async () => {
    if (!editModelName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a valid model name.');
      return;
    }

    try {
      const normalizationDataObj = {
        scale: parseFloat(editNormalizationData.scale) || 0.001,
        pos_offset: {
          x: parseFloat(editNormalizationData.pos_offset_x) || 0,
          y: parseFloat(editNormalizationData.pos_offset_y) || 0,
          z: parseFloat(editNormalizationData.pos_offset_z) || 0
        },
        rot_offset: {
          x: parseFloat(editNormalizationData.rot_offset_x) || 90,
          y: parseFloat(editNormalizationData.rot_offset_y) || 0,
          z: parseFloat(editNormalizationData.rot_offset_z) || 0
        }
      };

      const updateData = {
        name: editModelName.trim(),
        normalization_data: normalizationDataObj
      };

      const result = await updateModel(editingModel.model_id, updateData);

      if (result.success) {
        // Update the model in the local state
        setModels(prevModels =>
          prevModels.map(model =>
            model.model_id === editingModel.model_id
              ? { ...model, name: editModelName.trim(), normalization_data: normalizationDataObj }
              : model
          )
        );

        Alert.alert('Success', 'Model updated successfully!');
        handleEditCancel();
      } else {
        Alert.alert('Update Failed', result.message || 'Failed to update model. Please try again.');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Update Error', 'An error occurred while updating the model. Please try again.');
    }
  }, [editModelName, editNormalizationData, editingModel, handleEditCancel]);

  // Download functionality
  const handleDownloadModel = useCallback(async (model) => {
    if (!model.download_urls_json) {
      Alert.alert('Error', 'No download URLs available for this model');
      return;
    }

    try {
      setDownloadingIds(prev => new Set(prev).add(model.model_id));

      await downloadFolderFromJson(model.download_urls_json, false);

      const localPath = await findCragFolder(model.model_id);

      if (localPath) {
        // Update the model's local availability in the state
        setModels(prevModels =>
          prevModels.map(m =>
            m.model_id === model.model_id
              ? { ...m, isAvailable: true, localPath }
              : m
          )
        );
        Alert.alert('Success', 'Model downloaded successfully!');
      } else {
        Alert.alert('Warning', 'Model downloaded but local path not found');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download model. Please try again.');
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(model.model_id);
        return next;
      });
    }
  }, []);

  // Check local availability when models load
  const checkLocalAvailability = useCallback(async (modelsList) => {
    const updatedModels = await Promise.all(
      modelsList.map(async (model) => {
        try {
          const localPath = await findCragFolder(model.model_id);
          return {
            ...model,
            isAvailable: !!localPath,
            localPath: localPath || null
          };
        } catch (error) {
          return {
            ...model,
            isAvailable: false,
            localPath: null
          };
        }
      })
    );
    return updatedModels;
  }, []);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Models</Text>
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: colors.accent }]}
          onPress={handleDocumentPicker}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textDim }]}>
              Loading your models...
            </Text>
          </View>
        ) : models.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={colors.textDim} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Models Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>
              You haven't uploaded any 3D models yet.
            </Text>
          </View>
        ) : (
          models.map((model, index) => (
            <ModelCard
              key={model.model_id || `model-${index}`}
              model={model}
              colors={colors}
              onDelete={() => handleDeleteModel(model.model_id, model.name)}
              onDownload={() => handleDownloadModel(model)}
              onOpenUnity={() => handleOpenUnityIndoor(model)}
              onEdit={() => handleEditModel(model)}
              isDeleting={deletingIds.has(model.model_id)}
              isDownloading={downloadingIds.has(model.model_id)}
            />
          ))
        )}
      </ScrollView>

      {/* Upload Modals */}
      {showCragSelection && selectedZipFile && (
        <Modal
          visible={showCragSelection}
          transparent={false}
          animationType="slide"
          onRequestClose={handleCragSelectionCancel}
        >
          <View style={[styles.cragSelectionContainer, { backgroundColor: colors.bg }]}>
            <View style={[styles.cragSelectionHeader, { borderBottomColor: colors.divider }]}>
              <TouchableOpacity onPress={handleCragSelectionCancel}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.cragSelectionTitle, { color: colors.text }]}>
                Select Crag for Upload
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.cragSelectionBody}>
              <Text style={[styles.uploadInfo, { color: colors.textDim }]}>
                Uploading ZIP file: {selectedZipFile.name}
              </Text>
              <Text style={[styles.uploadSize, { color: colors.textDim }]}>
                Size: {Math.round(selectedZipFile.size / 1024)} KB
              </Text>

              <FlatList
                data={crags}
                keyExtractor={(item) => item.crag_id || item.crag_pretty_id || item.id}
                style={styles.cragSelectionList}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: crag }) => (
                  <TouchableOpacity
                    style={[styles.cragSelectionItem, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                    onPress={() => handleCragSelectedForUpload(crag)}
                  >
                    <View style={styles.cragSelectionInfo}>
                      <Text
                        style={[styles.cragSelectionName, { color: colors.text }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {crag.name}
                      </Text>
                      <Text
                        style={[styles.cragSelectionLocation, { color: colors.textDim }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        📍 {getLocationText(crag)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      )}

      {showNameInput && selectedCragForUpload && (
        <Modal
          visible={showNameInput}
          transparent={true}
          animationType="slide"
          onRequestClose={handleNameInputCancel}
        >
          <View style={styles.nameInputOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={handleNameInputCancel}
            />
            <View style={[styles.nameInputContainer, { backgroundColor: colors.surface }]}>
              <View style={[styles.nameInputHeader, { borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={handleNameInputCancel}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.nameInputTitle, { color: colors.text }]}>
                  Name Your Model
                </Text>
                <TouchableOpacity onPress={handleNameInputConfirm}>
                  <Ionicons name="checkmark" size={24} color={colors.accent} />
                </TouchableOpacity>
              </View>

              <View style={styles.nameInputBody}>
                <Text style={[styles.nameInputLabel, { color: colors.text }]}>
                  Model Name
                </Text>
                <TextInput
                  style={[styles.nameInputField, {
                    backgroundColor: colors.bg,
                    borderColor: colors.divider,
                    color: colors.text
                  }]}
                  value={modelName}
                  onChangeText={setModelName}
                  placeholder="Enter model name..."
                  placeholderTextColor={colors.textDim}
                  autoFocus={true}
                  selectTextOnFocus={true}
                />

                <Text style={[styles.nameInputLabel, { color: colors.text, marginTop: 16 }]}>
                  Normalization Settings
                </Text>

                <View style={styles.normalizationRow}>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>Scale</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={normalizationData.scale}
                      onChangeText={(text) => setNormalizationData(prev => ({ ...prev, scale: text }))}
                      placeholder="0.001"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={[styles.normalizationSectionLabel, { color: colors.textDim }]}>Position Offset</Text>
                <View style={styles.normalizationRow}>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>X</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={normalizationData.pos_offset_x}
                      onChangeText={(text) => setNormalizationData(prev => ({ ...prev, pos_offset_x: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>Y</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={normalizationData.pos_offset_y}
                      onChangeText={(text) => setNormalizationData(prev => ({ ...prev, pos_offset_y: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>Z</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={normalizationData.pos_offset_z}
                      onChangeText={(text) => setNormalizationData(prev => ({ ...prev, pos_offset_z: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={[styles.normalizationSectionLabel, { color: colors.textDim }]}>Rotation Offset</Text>
                <View style={styles.normalizationRow}>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>X</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={normalizationData.rot_offset_x}
                      onChangeText={(text) => setNormalizationData(prev => ({ ...prev, rot_offset_x: text }))}
                      placeholder="90"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>Y</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={normalizationData.rot_offset_y}
                      onChangeText={(text) => setNormalizationData(prev => ({ ...prev, rot_offset_y: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>Z</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={normalizationData.rot_offset_z}
                      onChangeText={(text) => setNormalizationData(prev => ({ ...prev, rot_offset_z: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={[styles.nameInputInfo, { color: colors.textDim }]}>
                  Uploading to: {selectedCragForUpload.name}
                </Text>
                <Text style={[styles.nameInputFileInfo, { color: colors.textDim }]}>
                  File: {selectedZipFile?.name}
                </Text>

                <View style={styles.nameInputButtons}>
                  <TouchableOpacity
                    style={[styles.nameInputButton, styles.cancelButton, { borderColor: colors.divider }]}
                    onPress={handleNameInputCancel}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.nameInputButton, styles.confirmButton, { backgroundColor: colors.accent }]}
                    onPress={handleNameInputConfirm}
                  >
                    <Text style={styles.confirmButtonText}>Upload</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Model Modal */}
      {showEditModal && editingModel && (
        <Modal
          visible={showEditModal}
          transparent={true}
          animationType="slide"
          onRequestClose={handleEditCancel}
        >
          <View style={styles.nameInputOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={handleEditCancel}
            />
            <View style={[styles.nameInputContainer, { backgroundColor: colors.surface }]}>
              <View style={[styles.nameInputHeader, { borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={handleEditCancel}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.nameInputTitle, { color: colors.text }]}>
                  Edit Model
                </Text>
                <TouchableOpacity onPress={handleEditConfirm}>
                  <Ionicons name="checkmark" size={24} color={colors.accent} />
                </TouchableOpacity>
              </View>

              <View style={styles.nameInputBody}>
                <Text style={[styles.nameInputLabel, { color: colors.text }]}>
                  Model Name
                </Text>
                <TextInput
                  style={[styles.nameInputField, {
                    backgroundColor: colors.bg,
                    borderColor: colors.divider,
                    color: colors.text
                  }]}
                  value={editModelName}
                  onChangeText={setEditModelName}
                  placeholder="Enter model name..."
                  placeholderTextColor={colors.textDim}
                  autoFocus={true}
                  selectTextOnFocus={true}
                />

                <Text style={[styles.nameInputLabel, { color: colors.text, marginTop: 16 }]}>
                  Normalization Settings
                </Text>

                <View style={styles.normalizationRow}>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>Scale</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={editNormalizationData.scale}
                      onChangeText={(text) => setEditNormalizationData(prev => ({ ...prev, scale: text }))}
                      placeholder="0.001"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={[styles.normalizationSectionLabel, { color: colors.textDim }]}>Position Offset</Text>
                <View style={styles.normalizationRow}>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>X</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={editNormalizationData.pos_offset_x}
                      onChangeText={(text) => setEditNormalizationData(prev => ({ ...prev, pos_offset_x: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>Y</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={editNormalizationData.pos_offset_y}
                      onChangeText={(text) => setEditNormalizationData(prev => ({ ...prev, pos_offset_y: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>Z</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={editNormalizationData.pos_offset_z}
                      onChangeText={(text) => setEditNormalizationData(prev => ({ ...prev, pos_offset_z: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={[styles.normalizationSectionLabel, { color: colors.textDim }]}>Rotation Offset</Text>
                <View style={styles.normalizationRow}>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>X</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={editNormalizationData.rot_offset_x}
                      onChangeText={(text) => setEditNormalizationData(prev => ({ ...prev, rot_offset_x: text }))}
                      placeholder="90"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>Y</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={editNormalizationData.rot_offset_y}
                      onChangeText={(text) => setEditNormalizationData(prev => ({ ...prev, rot_offset_y: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.normalizationField}>
                    <Text style={[styles.normalizationLabel, { color: colors.textDim }]}>Z</Text>
                    <TextInput
                      style={[styles.normalizationInput, {
                        backgroundColor: colors.bg,
                        borderColor: colors.divider,
                        color: colors.text
                      }]}
                      value={editNormalizationData.rot_offset_z}
                      onChangeText={(text) => setEditNormalizationData(prev => ({ ...prev, rot_offset_z: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={[styles.nameInputInfo, { color: colors.textDim }]}>
                  Editing: {editingModel.name}
                </Text>

                <View style={styles.nameInputButtons}>
                  <TouchableOpacity
                    style={[styles.nameInputButton, styles.cancelButton, { borderColor: colors.divider }]}
                    onPress={handleEditCancel}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.nameInputButton, styles.confirmButton, { backgroundColor: colors.accent }]}
                    onPress={handleEditConfirm}
                  >
                    <Text style={styles.confirmButtonText}>Update</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function ModelCard({ model, colors, onDelete, onDownload, onOpenUnity, onEdit, isDeleting, isDownloading }) {
  return (
    <View
      style={[
        styles.modelCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.divider,
        },
      ]}
    >
      <View style={styles.modelHeader}>
        <View style={styles.modelIcon}>
          <Ionicons name="cube" size={24} color={colors.accent} />
        </View>
        <View style={styles.modelInfo}>
          <Text style={[styles.modelName, { color: colors.text }]} numberOfLines={1}>
            {model.name || 'Unnamed Model'}
          </Text>
          <View style={styles.modelStatusRow}>
            {model.file_size && (
              <Text style={[styles.modelDetails, { color: colors.textDim }]}>
                Size: {formatFileSize(model.file_size)}
              </Text>
            )}
            <View style={styles.statusIndicator}>
              <Ionicons
                name={model.isAvailable ? "checkmark-circle" : "cloud-outline"}
                size={14}
                color={model.isAvailable ? colors.accent : colors.textDim}
              />
              <Text style={[styles.statusText, { color: model.isAvailable ? colors.accent : colors.textDim }]}>
                {model.isAvailable ? 'Downloaded' : 'Cloud only'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.actionButtons}>
          {model.isAvailable && (
            <TouchableOpacity
              style={[
                styles.unityButton,
                {
                  backgroundColor: '#FF6B35',
                },
              ]}
              onPress={onOpenUnity}
              disabled={isDeleting || isDownloading}
            >
              <Ionicons name="cube-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {!model.isAvailable && model.download_urls_json && (
            <TouchableOpacity
              style={[
                styles.downloadButton,
                {
                  backgroundColor: colors.accent,
                  opacity: isDownloading ? 0.6 : 1,
                },
              ]}
              onPress={onDownload}
              disabled={isDownloading || isDeleting}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.editButton,
              {
                backgroundColor: colors.bg,
                borderColor: colors.divider,
              },
            ]}
            onPress={onEdit}
            disabled={isDeleting || isDownloading}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.textDim} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              {
                backgroundColor: colors.bg,
                borderColor: colors.divider,
              },
            ]}
            onPress={onDelete}
            disabled={isDeleting || isDownloading}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.textDim} />
            ) : (
              <Ionicons name="trash-outline" size={18} color={colors.textDim} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {model.description && (
        <Text style={[styles.modelDescription, { color: colors.textDim }]} numberOfLines={2}>
          {model.description}
        </Text>
      )}
    </View>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  topBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 6, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  modelCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  modelStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelDetails: {
    fontSize: 12,
    marginBottom: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  modelDescription: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  unityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Upload button styles
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal styles
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // Crag selection modal
  cragSelectionContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cragSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cragSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  cragSelectionBody: {
    flex: 1,
    padding: 16,
  },
  uploadInfo: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '600',
    lineHeight: 20,
  },
  uploadSize: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.75,
    lineHeight: 16,
  },
  cragSelectionList: {
    flex: 1,
    paddingHorizontal: 4,
  },
  cragSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    minHeight: 80,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  cragSelectionInfo: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'center',
  },
  cragSelectionName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  cragSelectionLocation: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.75,
  },

  // Name input modal
  nameInputOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  nameInputContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  nameInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nameInputTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  nameInputBody: {
    padding: 20,
  },
  nameInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  nameInputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  nameInputInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  nameInputFileInfo: {
    fontSize: 12,
    marginBottom: 20,
    opacity: 0.7,
  },
  nameInputButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInputButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Normalization styles
  normalizationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  normalizationField: {
    flex: 1,
  },
  normalizationLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  normalizationInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  normalizationSectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },
});