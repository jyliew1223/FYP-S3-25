// GoClimb/src/screens/RouteDataManager.js
import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { RouteDataStorage } from '../services/storage/RouteDataStorage';
import { UploadModelRouteData, DeleteModelRouteData, GetRouteDatasByUserId } from '../services/api/ModelRouteDataService';
import { fetchRoutesByCragIdGET } from '../services/api/CragService';




export default function RouteDataManager() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [routeDataList, setRouteDataList] = useState([]);
  const [allRouteData, setAllRouteData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingIds, setUploadingIds] = useState(new Set());
  const [modelNames, setModelNames] = useState(new Map());
  const [routeNames, setRouteNames] = useState(new Map());
  const [routeSelectionModal, setRouteSelectionModal] = useState(null);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Simplified name resolution
  const updateNames = useCallback((serverData) => {
    const newModelNames = new Map();
    const newRouteNames = new Map();
    
    serverData.forEach(item => {
      // Extract model names
      if (item.model?.model_id) {
        const modelName = item.model.name || `Model #${item.model.model_id.slice(-6)}`;
        newModelNames.set(item.model.model_id, modelName);
      }
      
      // Extract route names
      if (item.route?.route_id && item.route?.route_name) {
        newRouteNames.set(item.route.route_id, item.route.route_name);
      }
    });
    
    if (newModelNames.size > 0) {
      setModelNames(prev => new Map([...prev, ...newModelNames]));
    }
    if (newRouteNames.size > 0) {
      setRouteNames(prev => new Map([...prev, ...newRouteNames]));
    }
  }, []);

  const loadRouteData = useCallback(async () => {
    try {
      // Load local data
      const localData = await RouteDataStorage.getAllRouteData();
      const processedLocalData = localData.map(item => ({
        ...item,
        source: item.source || 'local'
      }));

      // Load server data
      const serverResult = await GetRouteDatasByUserId();
      let serverData = [];
      
      if (serverResult.success && Array.isArray(serverResult.data)) {
        // Update names from server data
        updateNames(serverResult.data);
        
        // Process server data
        const localUploadedIds = new Set(
          processedLocalData
            .filter(item => item.uploaded && item.route_data_id)
            .map(item => item.route_data_id)
        );

        serverData = serverResult.data
          .filter(item => !localUploadedIds.has(item.model_route_data_id))
          .map(item => ({
            id: item.model_route_data_id,
            route_data_id: item.model_route_data_id,
            modelId: item.model?.model_id,
            routeId: item.route?.route_id,
            cragId: item.model?.crag?.crag_id,
            routeData: item.route_data,
            timestamp: new Date().toISOString(),
            uploaded: true,
            source: 'server'
          }));
      }

      // Merge and sort data
      const allData = [...processedLocalData, ...serverData];
      allData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Store all data and apply current filter
      setAllRouteData(allData);
      applyFilter(allData, filter);

    } catch (error) {
      console.error('[RouteDataManager] Failed to load route data:', error);
      Alert.alert('Error', 'Failed to load route data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateNames, applyFilter, filter]);

  useEffect(() => {
    loadRouteData();
  }, [loadRouteData]);



  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRouteData();
  }, [loadRouteData]);

  const applyFilter = useCallback((data, filterType) => {
    let filtered = data;
    if (filterType === 'local') {
      filtered = data.filter(item => item.source === 'local' || !item.source);
    } else if (filterType === 'server') {
      filtered = data.filter(item => item.source === 'server');
    }
    setRouteDataList(filtered);
  }, []);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    loadRouteData(); // Reload with new filter
  }, [loadRouteData]);

  const handleUpload = useCallback(async (item) => {
    if (!item.modelId) {
      Alert.alert('Error', 'Missing model ID for upload');
      return;
    }

    if (!item.routeId) {
      Alert.alert('Error', 'Please assign a route before uploading');
      return;
    }

    // Check if the route ID is valid (not just a local ID)
    const routeName = routeNames.get(item.routeId) || 'Unknown Route';
    if (routeName === 'Unknown Route') {
      Alert.alert(
        'Invalid Route Assignment', 
        'This model route data is not assigned to a valid route. Please select a real route from the crag before uploading.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Assign Route', 
            onPress: () => handleAssignRoute(item)
          }
        ]
      );
      return;
    }

    setUploadingIds(prev => new Set(prev).add(item.id));

    try {
      console.log('[RouteDataManager] Uploading item:', {
        modelId: item.modelId,
        routeId: item.routeId,
        routeIdType: typeof item.routeId,
        hasRouteData: !!item.routeData,
        routeDataKeys: item.routeData ? Object.keys(item.routeData) : []
      });
      
      console.log('[RouteDataManager] API call will use:', {
        model_id: item.modelId,
        route_id: item.routeId,
        route_data: item.routeData
      });
      
      const result = await UploadModelRouteData(item.modelId, item.routeId, item.routeData);
      
      if (result.success) {
        const route_data_id = result.data?.model_route_data_id;
        
        if (route_data_id) {
          await RouteDataStorage.markAsUploaded(item.id, { route_data_id });
          await loadRouteData();
        } else {
          console.warn('[RouteDataManager] No model_route_data_id in response');
          Alert.alert('Warning', 'Upload succeeded but no ID returned');
        }
      } else {
        Alert.alert('Upload Failed', result.error || 'Failed to upload route data');
      }
    } catch (error) {
      console.error('[RouteDataManager] Upload error:', error);
      Alert.alert('Error', 'An error occurred during upload');
    } finally {
      setUploadingIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [loadRouteData, routeNames, handleAssignRoute]);

  const handleDelete = useCallback((item) => {
    const performDelete = async () => {
      try {
        // Check if item needs server deletion
        const needsServerDelete = (item.uploaded || item.source === 'server') && item.route_data_id;
        
        console.log('[RouteDataManager] Delete item:', {
          id: item.id,
          uploaded: item.uploaded,
          source: item.source,
          route_data_id: item.route_data_id,
          needsServerDelete
        });

        if (needsServerDelete) {
          // Item is uploaded or from server - delete from server first
          console.log('[RouteDataManager] Deleting from server:', item.route_data_id);
          const result = await DeleteModelRouteData(item.route_data_id);
          
          if (!result.success) {
            if (item.source === 'server') {
              // Server-only item failed to delete from server
              throw new Error(result.error || 'Failed to delete from server');
            } else {
              // Local item that was uploaded - offer local delete if server delete failed
              Alert.alert(
                'Server Delete Failed',
                'Failed to delete from server. Delete locally anyway?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete Locally',
                    style: 'destructive',
                    onPress: async () => {
                      await RouteDataStorage.deleteRouteData(item.id);
                      await loadRouteData();
                    },
                  },
                ]
              );
              return;
            }
          }
          
          console.log('[RouteDataManager] Successfully deleted from server');
        } else {
          // Local-only item - no server deletion needed
          console.log('[RouteDataManager] Local-only item, skipping server deletion');
        }
        
        // Delete from local storage if not server-only
        if (item.source !== 'server') {
          console.log('[RouteDataManager] Deleting from local storage');
          await RouteDataStorage.deleteRouteData(item.id);
        }
        
        await loadRouteData();
      } catch (error) {
        console.error('[RouteDataManager] Delete error:', error);
        Alert.alert('Error', error.message || 'Failed to delete route data');
      }
    };

    Alert.alert(
      'Delete Route Data',
      'Are you sure you want to delete this route data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]
    );
  }, [loadRouteData]);



  const handleAssignRoute = useCallback((item) => {
    if (!item.cragId) {
      Alert.alert(
        'Missing Crag Information', 
        'This route data does not have crag information. Please ensure the crag ID is provided when creating route data.'
      );
      return;
    }

    setRouteSelectionModal({ item, cragId: item.cragId });
    setAvailableRoutes([]);
    loadRoutesForCrag(item.cragId);
  }, []);

  const loadRoutesForCrag = useCallback(async (cragId) => {
    console.log('[RouteDataManager] Loading actual routes for crag:', cragId);
    console.log('[RouteDataManager] CragId type:', typeof cragId, 'Value:', cragId);
    setLoadingRoutes(true);
    try {
      // Get actual routes from the crag (not from model route data)
      const response = await fetchRoutesByCragIdGET(cragId);
      console.log('[RouteDataManager] fetchRoutesByCragIdGET full response:', response);
      console.log('[RouteDataManager] fetchRoutesByCragIdGET result:', {
        success: response?.success,
        routeCount: response?.routes?.length || 0,
        rawRoutes: response?.routes
      });
      
      if (response?.success && Array.isArray(response.routes)) {
        const cragRoutes = response.routes.map(route => ({
          route_id: route.route_id,
          route_name: route.route_name || route.name,
          name: route.route_name || route.name, // For compatibility
          gradeFont: route.gradeFont // Include grade for display
        }));
        
        console.log('[RouteDataManager] Processed routes for crag:', {
          cragId,
          routeCount: cragRoutes.length,
          routes: cragRoutes.map(r => ({ 
            id: r.route_id, 
            name: r.route_name,
            grade: r.gradeFont 
          }))
        });
        
        setAvailableRoutes(cragRoutes);
      } else {
        console.log('[RouteDataManager] No routes found for crag or API call failed');
        console.log('[RouteDataManager] Response details:', {
          success: response?.success,
          hasRoutes: Array.isArray(response?.routes),
          routesLength: response?.routes?.length,
          error: response?.error
        });
        setAvailableRoutes([]);
      }
    } catch (error) {
      console.error('[RouteDataManager] Failed to load routes for crag:', error);
      console.error('[RouteDataManager] Error details:', {
        message: error.message,
        stack: error.stack
      });
      setAvailableRoutes([]);
    } finally {
      setLoadingRoutes(false);
    }
  }, []);

  const handleRouteSelected = useCallback(async (selectedRoute) => {
    if (!routeSelectionModal || !selectedRoute) return;

    try {
      const { item } = routeSelectionModal;
      
      // Update local storage
      const allData = await RouteDataStorage.getAllRouteData();
      const updatedData = allData.map(dataItem => 
        dataItem.id === item.id ? { ...dataItem, routeId: selectedRoute.route_id } : dataItem
      );
      
      const RNFS = require('react-native-fs');
      const { LOCAL_DIR } = require('../constants/folder_path');
      await RNFS.writeFile(
        `${LOCAL_DIR.BASE_DIR}/route_data.json`, 
        JSON.stringify(updatedData, null, 2), 
        'utf8'
      );

      // 🚀 OPTIMIZED: Update only the specific item in state
      const updatedItem = { ...item, routeId: selectedRoute.route_id };
      
      // Update allRouteData
      setAllRouteData(prev => 
        prev.map(dataItem => 
          dataItem.id === item.id ? updatedItem : dataItem
        )
      );
      
      // Update filtered list
      setRouteDataList(prev => 
        prev.map(dataItem => 
          dataItem.id === item.id ? updatedItem : dataItem
        )
      );

      // Update modal state
      setRouteSelectionModal(prev => ({
        ...prev,
        item: updatedItem
      }));

      // Route name will be resolved when data is reloaded

      // If this was triggered from upload, proceed with upload after route assignment
      if (routeSelectionModal.isForUpload) {
        setRouteSelectionModal(null); // Close modal first
        
        // Wait a bit for state to update, then trigger upload
        setTimeout(() => {
          handleUpload(updatedItem);
        }, 100);
        return;
      }
    } catch (error) {
      console.error('[RouteDataManager] Failed to assign route:', error);
      Alert.alert('Error', 'Failed to assign route');
    }
  }, [routeSelectionModal]);

  // Simple date formatter (no need for useCallback)
  const formatDate = (timestamp) => new Date(timestamp).toLocaleString();

  // Name editing functions
  const handleStartEditing = useCallback((item) => {
    const currentName = item.customName || item.routeData?.route_name || `Route Data #${item.id.slice(-6)}`;
    setEditingId(item.id);
    setEditingName(currentName);
  }, []);

  const handleSaveName = useCallback(async (item) => {
    if (!editingName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      // Update local storage
      const allData = await RouteDataStorage.getAllRouteData();
      const updatedData = allData.map(dataItem => 
        dataItem.id === item.id 
          ? { ...dataItem, customName: editingName.trim() } 
          : dataItem
      );
      
      const RNFS = require('react-native-fs');
      const { LOCAL_DIR } = require('../constants/folder_path');
      await RNFS.writeFile(
        `${LOCAL_DIR.BASE_DIR}/route_data.json`, 
        JSON.stringify(updatedData, null, 2), 
        'utf8'
      );

      // 🚀 OPTIMIZED: Update only the specific item in state instead of full refresh
      const updatedItem = { ...item, customName: editingName.trim() };
      
      // Update allRouteData
      setAllRouteData(prev => 
        prev.map(dataItem => 
          dataItem.id === item.id ? updatedItem : dataItem
        )
      );
      
      // Update filtered list
      setRouteDataList(prev => 
        prev.map(dataItem => 
          dataItem.id === item.id ? updatedItem : dataItem
        )
      );

      // Clear editing state
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('[RouteDataManager] Failed to save name:', error);
      Alert.alert('Error', 'Failed to save name');
    }
  }, [editingName]);

  const handleCancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  // Memoized FlatList props
  const keyExtractor = useCallback((item) => item.id, []);
  const refreshControl = useMemo(() => (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  ), [refreshing, onRefresh]);

  // Memoized styles to prevent recreation on every render
  const cardStyles = useMemo(() => ({
    card: [styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }],
    title: [styles.cardTitle, { color: colors.text }],
    timestamp: [styles.cardTimestamp, { color: colors.textDim }],
    infoLabel: [styles.infoLabel, { color: colors.textDim }],
    infoValue: [styles.infoValue, { color: colors.text }],
    uploadedBadge: [styles.statusBadge, { backgroundColor: colors.accent + '20' }],
    serverBadge: [styles.statusBadge, { backgroundColor: '#4A90E220' }],
    uploadButton: [styles.actionButton, { backgroundColor: colors.accent }],
    disabledButton: { backgroundColor: colors.divider, opacity: 0.6 },
    assignButton: [styles.actionButton, { backgroundColor: '#28A745' }],
    deleteButton: [styles.actionButton, { backgroundColor: '#FF6B6B' }],
  }), [colors]);

  const renderRouteDataItem = useCallback(({ item }) => {
    const isUploading = uploadingIds.has(item.id);
    const modelName = modelNames.get(item.modelId) || 'Unknown Model';
    const routeName = routeNames.get(item.routeId) || 'Unknown Route';
    
    return (
      <View style={cardStyles.card}>
        <View style={styles.cardTopSection}>
          {/* Status labels row - at the top */}
          <View style={styles.statusLabelsRow}>
            <View style={{ flex: 1 }} />
            {item.uploaded && (
              <View style={cardStyles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
                <Text style={[styles.statusText, { color: colors.accent }]}>Uploaded</Text>
              </View>
            )}
            {item.source === 'server' && (
              <View style={cardStyles.serverBadge}>
                <Ionicons name="cloud" size={14} color="#4A90E2" />
                <Text style={[styles.statusText, { color: '#4A90E2' }]}>Server</Text>
              </View>
            )}
          </View>
          
          {/* Name row - below the labels */}
          <View style={styles.nameRow}>
            {editingId === item.id ? (
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.accent }]}
                value={editingName}
                onChangeText={setEditingName}
                onSubmitEditing={() => handleSaveName(item)}
                placeholder="Enter route name"
                placeholderTextColor={colors.textDim}
                autoFocus
                selectTextOnFocus
                returnKeyType="done"
                blurOnSubmit={true}
              />
            ) : (
              <View style={styles.nameContainer}>
                <Text style={cardStyles.title}>
                  {item.uploaded && item.route_data_id 
                    ? `#${item.route_data_id.split('-').pop() || item.route_data_id}`
                    : (item.customName || item.routeData?.route_name || `Route Data #${item.id.slice(-6)}`)
                  }
                </Text>
                {!item.uploaded && (
                  <TouchableOpacity onPress={() => handleStartEditing(item)}>
                    <Ionicons name="pencil" size={14} color={colors.textDim} style={styles.editIcon} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          <Text style={cardStyles.timestamp}>
            {formatDate(item.timestamp)}
          </Text>
        </View>

        <View style={styles.cardInfoRows}>
          {item.modelId && (
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={14} color={colors.textDim} />
              <Text style={cardStyles.infoLabel}>Model:</Text>
              <Text style={cardStyles.infoValue} numberOfLines={1}>{modelName}</Text>
            </View>
          )}
          {item.routeId && (
            <View style={styles.infoRow}>
              <Ionicons name="trail-sign-outline" size={14} color={colors.textDim} />
              <Text style={cardStyles.infoLabel}>Route:</Text>
              <Text style={cardStyles.infoValue} numberOfLines={1}>{routeName}</Text>
            </View>
          )}
          {item.cragId && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={colors.textDim} />
              <Text style={cardStyles.infoLabel}>Crag:</Text>
              <Text style={cardStyles.infoValue} numberOfLines={1}>{item.cragId}</Text>
            </View>
          )}
        </View>

        {/* Warning when no route is selected */}
        {!item.uploaded && !item.routeId && (
          <View style={[styles.warningContainer, { backgroundColor: (colors.warning || '#FF9500') + '20', borderColor: colors.warning || '#FF9500' }]}>
            <Ionicons name="warning-outline" size={16} color={colors.warning || '#FF9500'} />
            <Text style={[styles.warningText, { color: colors.warning || '#FF9500' }]}>
              No route selected. Please assign a route before uploading.
            </Text>
          </View>
        )}

        <View style={styles.cardActions}>
          {!item.uploaded && (
            <>
              <TouchableOpacity
                style={[
                  cardStyles.uploadButton,
                  (!item.routeId || routeName === 'Unknown Route') && cardStyles.disabledButton
                ]}
                onPress={() => handleUpload(item)}
                disabled={isUploading || !item.routeId || routeName === 'Unknown Route'}>
                {isUploading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons 
                      name="cloud-upload-outline" 
                      size={18} 
                      color={(!item.routeId || routeName === 'Unknown Route') ? colors.textDim : "white"} 
                    />
                    <Text style={[
                      styles.actionButtonText,
                      (!item.routeId || routeName === 'Unknown Route') && { color: colors.textDim }
                    ]}>
                      Upload
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={cardStyles.assignButton}
                onPress={() => handleAssignRoute(item)}>
                <Ionicons name="location-outline" size={18} color="white" />
                <Text style={styles.actionButtonText}>Assign</Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity
            style={cardStyles.deleteButton}
            onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color="white" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [uploadingIds, modelNames, routeNames, colors, cardStyles, formatDate, handleUpload, handleAssignRoute, handleDelete, editingId, editingName, handleStartEditing, handleSaveName]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Route Data Manager</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Route Data Manager</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity 
            onPress={() => handleFilterChange('all')}
            style={[
              styles.filterButton,
              filter === 'all' && { backgroundColor: colors.accent + '20' }
            ]}>
            <Ionicons 
              name="apps" 
              size={18} 
              color={filter === 'all' ? colors.accent : colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleFilterChange('local')}
            style={[
              styles.filterButton,
              filter === 'local' && { backgroundColor: colors.accent + '20' }
            ]}>
            <Ionicons 
              name="phone-portrait" 
              size={18} 
              color={filter === 'local' ? colors.accent : colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleFilterChange('server')}
            style={[
              styles.filterButton,
              filter === 'server' && { backgroundColor: colors.accent + '20' }
            ]}>
            <Ionicons 
              name="cloud" 
              size={18} 
              color={filter === 'server' ? colors.accent : colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {routeDataList.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="folder-open-outline" size={64} color={colors.textDim} />
          <Text style={[styles.emptyText, { color: colors.textDim }]}>
            No route data stored yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textDim }]}>
            Route data from Unity will appear here
          </Text>
        </View>
      ) : (
        <>

          
          <FlatList
            data={routeDataList}
            keyExtractor={keyExtractor}
            renderItem={renderRouteDataItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={refreshControl}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={5}
            initialNumToRender={6}
            getItemLayout={(data, index) => ({
              length: 180,
              offset: 180 * index,
              index,
            })}

            viewabilityConfig={{
              itemVisiblePercentThreshold: 50,
              minimumViewTime: 100,
            }}
          />
        </>
      )}

      {/* Route Selection Modal */}
      {routeSelectionModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setRouteSelectionModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {routeSelectionModal?.isForUpload ? 'Select Route to Upload' : 'Assign Route'}
                </Text>
                <TouchableOpacity
                  onPress={() => setRouteSelectionModal(null)}
                  style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={[styles.modalDescription, { color: colors.textDim }]}>
                  {routeSelectionModal?.isForUpload 
                    ? 'Select which route this data represents to upload:' 
                    : 'Select which route this data represents:'
                  }
                </Text>
                
                {/* Show success message if route is assigned */}
                {routeSelectionModal.item.routeId && availableRoutes.find(r => r.route_id === routeSelectionModal.item.routeId) && (
                  <View style={[styles.successMessage, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                    <Text style={[styles.successText, { color: colors.accent }]}>
                      Route assigned: {availableRoutes.find(r => r.route_id === routeSelectionModal.item.routeId)?.name}
                    </Text>
                  </View>
                )}
                
                {loadingRoutes ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={[styles.loadingText, { color: colors.textDim }]}>
                      Loading routes...
                    </Text>
                  </View>
                ) : availableRoutes.length === 0 ? (
                  <View style={styles.emptyRoutesContainer}>
                    <Text style={[styles.emptyRoutesText, { color: colors.textDim }]}>
                      No routes available for this crag
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={availableRoutes}
                    keyExtractor={(route) => route.route_id}
                    style={styles.routesList}
                    renderItem={({ item: route }) => (
                      <TouchableOpacity
                        style={[
                          styles.routeItem,
                          {
                            backgroundColor: routeSelectionModal.item.routeId === route.route_id
                              ? colors.accent + '20'
                              : colors.surface,
                            borderColor: routeSelectionModal.item.routeId === route.route_id
                              ? colors.accent
                              : colors.divider,
                          },
                        ]}
                        onPress={() => handleRouteSelected(route)}>
                        <View style={styles.routeInfo}>
                          <Text style={[styles.routeName, { color: colors.text }]}>
                            {route.name}
                          </Text>
                          <Text style={[styles.routeGrade, { color: colors.textDim }]}>
                            Grade: {route.gradeFont || 'No grade'}
                          </Text>
                        </View>
                        {routeSelectionModal.item.routeId === route.route_id && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                        )}
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
              
              {/* Modal Footer with Done button */}
              <View style={[styles.modalFooter, { borderTopColor: colors.divider }]}>
                <TouchableOpacity
                  style={[styles.doneButton, { backgroundColor: colors.accent }]}
                  onPress={() => setRouteSelectionModal(null)}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
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
    fontWeight: '700',
  },
  filterButton: {
    padding: 6,
    borderRadius: 6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    padding: 16,
  },
  cardTopSection: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardTimestamp: {
    fontSize: 11,
  },
  cardInfoRows: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 45,
  },
  infoValue: {
    fontSize: 12,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
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
    maxHeight: '80%',
    borderRadius: 16,
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
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  emptyRoutesContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyRoutesText: {
    fontSize: 14,
    textAlign: 'center',
  },
  routesList: {
    maxHeight: 300,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  routeGrade: {
    fontSize: 12,
    marginTop: 2,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  doneButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // 🚀 Server loading banner styles
  serverLoadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },

  // Layout styles
  statusLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Name editing styles
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editIcon: {
    marginLeft: 8,
    opacity: 0.6,
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '700',
  },
  editButton: {
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});