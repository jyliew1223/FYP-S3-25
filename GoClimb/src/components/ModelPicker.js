import React, { useEffect, useState } from 'react';
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
  enableDirectAR = false,
  cragName = null
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
          setModels([]);
        }
      } catch (error) {
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
      const routeDataResponse = await ModelRouteDataService.FetchModelRouteDatasByModelId(model.model_id);
      
      let modelRouteData = [];
      if (routeDataResponse && routeDataResponse.success && routeDataResponse.data) {
        modelRouteData = routeDataResponse.data.map(item => {
          const routeName = item.route?.route_name || item.route_data?.route_name || 'Unknown Route';
          
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
      }

      const modelDataForUnity = {
        ...model,
        path: model.localPath,
        normalization_data: model.normalization_data,
        modelRouteData: modelRouteData,
      };
      
      if (enableDirectAR) {
        const unityData = {
          ...modelDataForUnity,
          normalizationJson: modelDataForUnity.normalization_data || {
            scale: 0.001,
            pos_offset: { x: 0, y: 0, z: 0 },
            rot_offset: { x: 90, y: 0, z: 0 }
          },
          routeJson: modelDataForUnity.modelRouteData || []
        };
        
        navigation.navigate('UnityAR', {
          modelData: unityData,
          cragId: cragId,
          cragName: cragName
        });
      } else if (onModelSelect) {
        onModelSelect(modelDataForUnity);
      }
    } catch (error) {
      const fallbackModelData = {
        ...model,
        path: model.localPath,
        normalization_data: model.normalization_data,
        modelRouteData: [],
      };
      
      if (enableDirectAR) {
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
    if (event) {
      event.stopPropagation();
    }

    if (!model.download_urls_json) {
      Alert.alert('Error', 'No download URLs available for this model');
      return;
    }

    try {
      setDownloadingModels(prev => new Set(prev).add(model.model_id));
      await downloadFolderFromJson(model.download_urls_json, false);

      const localPath = await findCragFolder(model.model_id);
      setModels(prevModels =>
        prevModels.map(m =>
          m.model_id === model.model_id
            ? { ...m, localPath, isAvailable: localPath !== null }
            : m,
        ),
      );

      Alert.alert('Success', 'Model downloaded successfully!');
    } catch (error) {
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
