import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchAllModelsByCragId } from '../services/api/CragService';
import { useTheme } from '../context/ThemeContext';
import { findCragFolder } from '../utils/LocalModelChecker';
import { downloadFolderFromJson } from '../services/firebase/FileDownloadHelper';

export default function ModelPicker({ cragId, onModelSelect }) {
  const { colors } = useTheme();
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [downloadingModels, setDownloadingModels] = useState(new Set());

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

  const handleSelect = model => {
    if (!model || !model.isAvailable) return;

    setSelectedModel(model);
    setModalVisible(false);
    if (onModelSelect) {
      onModelSelect({
        ...model,
        path: model.localPath,
      });
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.dropdown,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => hasModels && setModalVisible(true)}
        activeOpacity={0.7}
        disabled={!hasModels}>
        <Text
          style={[
            styles.dropdownText,
            {
              color: selectedModel ? colors.text : colors.textDim,
              textAlign: 'center',
            },
          ]}
          numberOfLines={1}>
          {!hasModels
            ? 'No models available'
            : selectedModel
              ? getDisplayLabel(selectedModel)
              : '-- Select a Model --'}
        </Text>
        {selectedModel && (
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.textDim}
          />
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.divider,
              },
            ]}
            onStartShouldSetResponder={() => true}>
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.divider },
              ]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select a Model
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

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
                      },
                    ]}>
                    <TouchableOpacity
                      style={styles.optionTouchable}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.7}
                      disabled={isDisabled || isDownloading}>
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
                            Not downloaded
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
                      </View>
                    </TouchableOpacity>

                    {isSelected ? (
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
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textDim }]}>
                    No models available for this crag
                  </Text>
                </View>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
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
