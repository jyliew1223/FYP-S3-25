import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchAllModelsByCragId } from '../services/api/CragService';
import * as ModelRouteDataService from '../services/api/ModelRouteDataService';
import { useTheme } from '../context/ThemeContext';
import { findCragFolder } from '../utils/LocalModelChecker';
import { downloadFolderFromJson } from '../services/firebase/FileDownloadHelper';


export default function ModelPicker({ 
  cragId, 
  onModelSelect, 
  enableDirectAR = false, // New prop to enable direct AR launch
  cragName = null, // Optional crag name for AR screen
  onARClose = null // Callback when AR is closed
}) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingModels, setDownloadingModels] = useState(new Set());
  const [fetchingRouteData, setFetchingRouteData] = useState(false);
  
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetchAllModelsByCragId(cragId);

        if (response && Array.isArray(response)) {
          // Check each model for local availability
          const modelsWithPaths = await Promise.all(
            response.map(async model => {
              try {
                const localPath = await findCragFolder(model.model_id);
                return {
                  ...model,
                  localPath,
                  isAvailable: localPath !== null,
                };
              } catch (err) {
                console.log(`[ModelPicker] Error checking model ${model.model_id}:`, err);
                return {
                  ...model,
                  localPath: null,
                  isAvailable: false,
                };
              }
            }),
          );
          setModels(modelsWithPaths);
        } else {
          console.warn('Unexpected response:', response);
          setModels([]);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, [cragId]);

  const handleSelect = async model => {
    if (!model || !model.isAvailable) return;

    setSelectedModel(model);
    setFetchingRouteData(true);

    try {
      // Fetch model route data (AR display routes) for the selected model
      console.log('[ModelPicker] Fetching model route data for model:', model.model_id);
      const routeDataResponse = await ModelRouteDataService.FetchModelRouteDatasByModelId(model.model_id);
      
      let modelRouteData = [];
      if (routeDataResponse && routeDataResponse.success && routeDataResponse.data) {
        // Transform backend data to Unity format
        modelRouteData = routeDataResponse.data.map(item => {
          // Extract route name from the route object or route_data
          const routeName = item.route?.route_name || item.route_data?.route_name || 'Unknown Route';
          
          // Extract points from route_data
          let points = [];
          if (item.route_data && item.route_data.points && Array.isArray(item.route_data.points)) {
            points = item.route_data.points.map(point => ({
              order: point.order || 1,
              pos: {
                x: point.pos?.x || 0,
                y: point.pos?.y || 0,
                z: point.pos?.z || 0
              }
            }));
          }
          
          return {
            route_name: routeName,
            points: points
          };
        });
        
        console.log('[ModelPicker] Transformed', modelRouteData.length, 'routes for Unity');
      } else {
        console.log('[ModelPicker] No model route data found for model:', model.model_id);
      }

      const modelDataForUnity = {
        ...model,
        path: model.localPath,
        normalization_data: model.normalization_data, // Pass normalization data to Unity
        modelRouteData: modelRouteData, // Pass model route data (AR display routes) to Unity
      };
      
      console.log('[ModelPicker] Sending model data to Unity with', modelRouteData.length, 'model routes');
      
      if (enableDirectAR) {
        // Launch AR directly
        const unityData = {
          ...modelDataForUnity,
          normalizationJson: modelDataForUnity.normalization_data || {
            scale: 0.001,
            pos_offset: { x: 0, y: 0, z: 0 },
            rot_offset: { x: 90, y: 0, z: 0 }
          },
          routeJson: modelDataForUnity.modelRouteData || []
        };
        
        console.log('[ModelPicker] Launching AR directly');
        navigation.navigate('UnityAR', {
          modelData: unityData,
          cragId: cragId,
          cragName: cragName
        });
      } else if (onModelSelect) {
        // Use callback for external handling
        onModelSelect(modelDataForUnity);
      }
    } catch (error) {
      console.error('[ModelPicker] Error fetching model route data:', error);
      // Still proceed with model selection even if route data fails
      const fallbackModelData = {
        ...model,
        path: model.localPath,
        normalization_data: model.normalization_data,
        modelRouteData: [], // Empty array if model route data fetch fails
      };
      
      if (enableDirectAR) {
        // Launch AR directly with fallback data
        const unityData = {
          ...fallbackModelData,
          normalizationJson: fallbackModelData.normalization_data || {
            scale: 0.001,
            pos_offset: { x: 0, y: 0, z: 0 },
            rot_offset: { x: 90, y: 0, z: 0 }
          },
          routeJson: []
        };
        
        navigation.navigate('UnityAR', {
          modelData: unityData,
          cragId: cragId,
          cragName: cragName
        });
      } else if (onModelSelect) {
        onModelSelect(fallbackModelData);
      }
    } finally {
      setFetchingRouteData(false);
    }
  };

  const handleDownload = async (model, event) => {
    // Stop event propagation to prevent selecting the item
    if (event) {
      event.stopPropagation();
    }

    if (!model.download_urls_json) {
      Alert.alert('Error', 'No download URLs available for this model');
      return;
    }

    try {
      setDownloadingModels(prev => new Set(prev).add(model.model_id));

      console.log('Starting download for model:', model.model_id);
      await downloadFolderFromJson(model.download_urls_json, false);

      // Check if model is now available
      const localPath = await findCragFolder(model.model_id);

      // Update the model in the list
      setModels(prevModels =>
        prevModels.map(m =>
          m.model_id === model.model_id
            ? { ...m, localPath, isAvailable: localPath !== null }
            : m,
        ),
      );

      Alert.alert('Success', 'Model downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download model. Please try again.');
    } finally {
      setDownloadingModels(prev => {
        const next = new Set(prev);
        next.delete(model.model_id);
        return next;
      });
    }
  };

  const getDisplayLabel = model => {
    if (!model) return '-- Select a Model --';
    return model.name || `Model uploaded by ${model.user?.username || 'Unknown'}`;
  };

  const hasAvailableModels = models.some(m => m.isAvailable);
  const hasModels = models.length > 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textDim }]}>
          Loading models...
        </Text>
      </View>
    );
  }



  // Show models directly as a list (no dropdown)
  return (
    <View style={styles.container}>
      {!hasModels ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={48} color={colors.textDim} />
          <Text style={[styles.emptyText, { color: colors.textDim }]}>
            No models available for this crag
          </Text>
        </View>
      ) : (
        <FlatList
          data={models}
          keyExtractor={item => String(item.model_id)}
          renderItem={({ item }) => {
            const isDisabled = !item.isAvailable;
            const isSelected = selectedModel?.model_id === item.model_id;
            const isDownloading = downloadingModels.has(item.model_id);
            const hasDownloadUrls = !!item.download_urls_json;

            return (
              <View
                style={[
                  styles.option,
                  {
                    backgroundColor: isSelected
                      ? colors.surfaceAlt
                      : colors.surface,
                    borderColor: colors.divider,
                  },
                ]}>
                <TouchableOpacity
                  style={styles.optionTouchable}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                  disabled={isDisabled || isDownloading || fetchingRouteData}>
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: colors.text,
                          fontWeight: isSelected ? '700' : '400',
                          opacity: isDisabled && !isDownloading ? 0.5 : 1,
                        },
                      ]}
                      numberOfLines={2}>
                      {getDisplayLabel(item)}
                    </Text>
                    {isDisabled && !isDownloading && !hasDownloadUrls && (
                      <Text
                        style={[
                          styles.optionSubtext,
                          { color: colors.textDim },
                        ]}>
                        Not available for download
                      </Text>
                    )}
                    {isDisabled && !isDownloading && hasDownloadUrls && (
                      <Text
                        style={[
                          styles.optionSubtext,
                          { color: colors.textDim },
                        ]}>
                        Tap download to get this model
                      </Text>
                    )}
                    {isDownloading && (
                      <Text
                        style={[
                          styles.optionSubtext,
                          { color: colors.accent },
                        ]}>
                        Downloading...
                      </Text>
                    )}
                    {fetchingRouteData && isSelected && (
                      <Text
                        style={[
                          styles.optionSubtext,
                          { color: colors.accent },
                        ]}>
                        Loading model routes...
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {fetchingRouteData && isSelected ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.accent}
                    style={styles.iconRight}
                  />
                ) : isSelected ? (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.accent}
                    style={styles.iconRight}
                  />
                ) : isDownloading ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.accent}
                    style={styles.iconRight}
                  />
                ) : isDisabled && hasDownloadUrls ? (
                  <TouchableOpacity
                    onPress={(e) => handleDownload(item, e)}
                    style={styles.downloadButton}
                    activeOpacity={0.7}>
                    <Ionicons
                      name="cloud-download-outline"
                      size={20}
                      color={colors.accent}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
          ItemSeparatorComponent={() => (
            <View
              style={[
                styles.separator,
                { backgroundColor: colors.divider },
              ]}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  optionTouchable: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 15,
  },
  optionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  iconRight: {
    marginRight: 16,
  },
  downloadButton: {
    padding: 12,
    marginRight: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
