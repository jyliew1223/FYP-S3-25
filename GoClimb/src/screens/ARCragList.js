import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { fetchAllCrag } from '../services/api/CragService';
import ModelPicker from '../components/ModelPicker';

export default function ARCragList() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [crags, setCrags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCrag, setSelectedCrag] = useState(null);
  const [showModelPicker, setShowModelPicker] = useState(false);


  const loadCrags = useCallback(async () => {
    try {
      const result = await fetchAllCrag();
      setCrags(result.success ? result.crags : []);
      if (!result.success) {
        Alert.alert('Error', 'Failed to load crags');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load crags');
      setCrags([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCrags();
  }, [loadCrags]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCrags();
  }, [loadCrags]);

  const handleCragPress = useCallback((crag) => {
    setSelectedCrag(crag);
    setShowModelPicker(true);
  }, []);

  const handleCloseModelPicker = useCallback(() => {
    setShowModelPicker(false);
    setSelectedCrag(null);
  }, []);

  const handleRealFieldAR = useCallback(() => {
    navigation.navigate('UnityOutdoorAR');
  }, [navigation]);

  const getLocationText = useCallback((item) => {
    const { city, country } = item.location_details || {};
    return (city && country) ? `${city}, ${country}` : 
           country || city || item.country || 'Unknown Location';
  }, []);

  const renderCragItem = useCallback(({ item }) => {

    return (
      <TouchableOpacity
        style={[styles.cragCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
        onPress={() => handleCragPress(item)}
      >
        <View style={styles.cragInfo}>
          <Text style={[styles.cragName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.cragLocation, { color: colors.textDim }]} numberOfLines={1}>
            📍 {getLocationText(item)}
          </Text>
          {item.description && (
            <Text style={[styles.cragDescription, { color: colors.textDim }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <View style={styles.arIcon}>
          <Ionicons name="camera" size={24} color={colors.accent} />
          <Text style={[styles.arText, { color: colors.accent }]}>AR</Text>
        </View>
      </TouchableOpacity>
    );
  }, [colors, handleCragPress, getLocationText]);

  const keyExtractor = useCallback((item) => item.crag_id || item.crag_pretty_id || item.id, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>AR Experience</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textDim }]}>Loading crags...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AR Experience</Text>
        <View style={{ width: 24 }} />
      </View>

      {crags.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={64} color={colors.textDim} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Crags Available</Text>
          <Text style={[styles.emptySubtext, { color: colors.textDim }]}>
            Pull to refresh to try again
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.infoBar, { backgroundColor: colors.surface }]}>
            <Ionicons name="information-circle" size={16} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.textDim }]}>
              Select a crag to start your AR climbing experience
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.realFieldButton, { backgroundColor: colors.accent }]}
            onPress={handleRealFieldAR}
          >
            <Ionicons name="globe-outline" size={24} color="#FFFFFF" />
            <Text style={styles.realFieldButtonText}>Real Field AR</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <FlatList
            data={crags}
            keyExtractor={keyExtractor}
            renderItem={renderCragItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.accent]}
                tintColor={colors.accent}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}


      {showModelPicker && selectedCrag && (
        <Modal
          visible={showModelPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseModelPicker}
        >
          <View style={styles.modelPickerOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop} 
              activeOpacity={1} 
              onPress={handleCloseModelPicker}
            />
            <View style={[styles.modelPickerContainer, { backgroundColor: colors.surface }]}>
              <View style={[styles.modelPickerHeader, { borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={handleCloseModelPicker}>
                  <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modelPickerTitle, { color: colors.text }]}>
                  Select Model for {selectedCrag.name}
                </Text>
                <View style={{ width: 24 }} />
              </View>
              
              <View style={styles.modelPickerContent}>
                <ModelPicker
                  cragId={selectedCrag.crag_id || selectedCrag.crag_pretty_id}
                  enableDirectAR={true}
                  cragName={selectedCrag.name}
                  onARClose={() => {
                    setShowModelPicker(false);
                    setSelectedCrag(null);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}




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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  realFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  realFieldButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  listContainer: {
    padding: 16,
  },
  cragCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cragInfo: {
    flex: 1,
  },
  cragName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cragLocation: {
    fontSize: 14,
    marginBottom: 4,
  },
  cragDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  arIcon: {
    alignItems: 'center',
    paddingLeft: 16,
  },
  arText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  modelPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modelPickerContainer: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modelPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modelPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  modelPickerContent: {
    flex: 1,
    padding: 16,
  },



});