// GoClimb/src/screens/LogClimbScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
// Removed react-native-element-dropdown dependency
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from '@react-native-firebase/auth';
import {
  createClimbLog,
} from '../services/api/ClimbLogService';
import {
  fetchRandomCrags,
  fetchRoutesByCragIdGET,
} from '../services/api/CragService';
import { convertNumericGradeToFont } from '../utils/gradeConverter';

export default function LogClimbScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const currentUser = getAuth().currentUser;

  // Removed activeTab - only showing log form now
  
  // Form state
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCragKey, setSelectedCragKey] = useState('');
  const [selectedRouteKey, setSelectedRouteKey] = useState('');
  const [dateClimbed, setDateClimbed] = useState(getTodayDate());
  const [topped, setTopped] = useState(false); // status field
  const [attempts, setAttempts] = useState('1'); // attempt field
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [cragModalVisible, setCragModalVisible] = useState(false);
  const [routeModalVisible, setRouteModalVisible] = useState(false);

  // Dropdown data
  const [cragData, setCragData] = useState([]);
  const [allRouteData, setAllRouteData] = useState([]);
  const [filteredRouteData, setFilteredRouteData] = useState([]);
  const [cragsMap, setCragsMap] = useState({});
  const [routesMap, setRoutesMap] = useState({});
  const [loadingData, setLoadingData] = useState(false);

  // Modal state
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Toast
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Filter routes when crag is selected
  useEffect(() => {
    if (selectedCragKey && allRouteData.length > 0) {
      const filtered = allRouteData.filter(route => route.cragId === selectedCragKey);
      setFilteredRouteData(filtered);
      // Clear route selection when crag changes
      setSelectedRouteKey('');
    } else {
      setFilteredRouteData([]);
    }
  }, [selectedCragKey, allRouteData]);

  async function loadAllData() {
    setLoadingData(true);
    try {
      // Load crags
      const cragsRes = await fetchRandomCrags(100);
      if (cragsRes?.success && cragsRes.crags) {
        // Format crags for Dropdown
        const formattedCrags = cragsRes.crags.map(crag => ({
          label: crag.name,
          value: crag.crag_pretty_id || crag.crag_id || crag.id,
        }));
        
        // Create crag map
        const cragMap = {};
        cragsRes.crags.forEach(crag => {
          const key = crag.crag_pretty_id || crag.crag_id || crag.id;
          cragMap[key] = crag;
        });
        
        setCragData(formattedCrags);
        setCragsMap(cragMap);
        
        // Load routes for all crags
        const allRoutes = [];
        const routeMap = {};
        
        for (const crag of cragsRes.crags) {
          const cragId = crag.crag_pretty_id || crag.crag_id || crag.id;
          try {
            const routesRes = await fetchRoutesByCragIdGET(cragId);
            if (routesRes?.success && routesRes.routes) {
              routesRes.routes.forEach(route => {
                const routeName = route.route_name || route.name || 'Unknown Route';
                const gradeRaw = route.route_grade || route.grade || route.gradeRaw;
                const gradeDisplay = convertNumericGradeToFont(gradeRaw);
                const routeKey = route.route_pretty_id || route.route_id || route.id;
                
                allRoutes.push({
                  label: `${routeName}, ${gradeDisplay}`,
                  value: routeKey,
                  cragId: cragId,
                });
                
                routeMap[routeKey] = route;
              });
            }
          } catch (error) {
            console.log(`[LogClimbScreen] Error loading routes for crag ${cragId}:`, error);
          }
        }
        
        setAllRouteData(allRoutes);
        setRoutesMap(routeMap);
      }
    } catch (error) {
      console.log('[LogClimbScreen] Error loading data:', error);
    }
    setLoadingData(false);
  }





  async function handleSubmit() {
    if (!currentUser) {
      showToast('You must be logged in');
      return;
    }

    if (!selectedRouteKey || !selectedCragKey) {
      showToast('Please select both crag and route');
      return;
    }

    const attemptsNum = parseInt(attempts);
    if (isNaN(attemptsNum) || attemptsNum < 1) {
      showToast('Attempts must be a number greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createClimbLog({
        routeId: selectedRouteKey,
        cragId: selectedCragKey,
        dateClimbed,
        title: title.trim(),
        notes: notes.trim(),
        status: topped,
        attempt: attemptsNum,
      });

      if (res?.success) {
        showToast('Climb logged successfully!');
        // Clear form
        setTitle('');
        setNotes('');
        setSelectedCragKey('');
        setSelectedRouteKey('');
        setDateClimbed(getTodayDate());
        setTopped(false);
        setAttempts('1');
      } else {
        showToast(res?.message || 'Failed to log climb');
      }
    } catch (error) {
      console.log('[LogClimbScreen] Error:', error);
      showToast('Failed to log climb');
    }
    setSubmitting(false);
  }



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Climb Log</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Toast */}
      {toast ? (
        <View style={[styles.toast, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{toast}</Text>
        </View>
      ) : null}

      {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Title */}
          <Text style={[styles.label, { color: colors.text }]}>Title (Optional)</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your climb a title"
            placeholderTextColor={colors.textDim}
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.divider }]}
          />

          {/* Notes */}
          <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="How was the climb?"
            placeholderTextColor={colors.textDim}
            multiline
            numberOfLines={4}
            style={[styles.textArea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.divider }]}
          />

          {/* Crag Selector */}
          <Text style={[styles.label, { color: colors.text }]}>Crag *</Text>
          <TouchableOpacity
            onPress={() => setCragModalVisible(true)}
            style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.divider }]}
          >
            <Text style={[
              selectedCragKey ? styles.selectedTextStyle : styles.placeholderStyle, 
              { color: selectedCragKey ? colors.text : colors.textDim }
            ]}>
              {selectedCragKey ? cragData.find(c => c.value === selectedCragKey)?.label : "Select a crag"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textDim} />
          </TouchableOpacity>

          {/* Route Selector */}
          <Text style={[styles.label, { color: colors.text }]}>Route *</Text>
          <TouchableOpacity
            onPress={() => selectedCragKey && setRouteModalVisible(true)}
            style={[
              styles.dropdown, 
              { 
                backgroundColor: colors.surface, 
                borderColor: colors.divider,
                opacity: selectedCragKey ? 1 : 0.5,
              }
            ]}
            disabled={!selectedCragKey}
          >
            <Text style={[
              selectedRouteKey ? styles.selectedTextStyle : styles.placeholderStyle, 
              { color: selectedRouteKey ? colors.text : colors.textDim }
            ]}>
              {selectedRouteKey ? filteredRouteData.find(r => r.value === selectedRouteKey)?.label : (selectedCragKey ? "Select a route" : "Select a crag first")}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textDim} />
          </TouchableOpacity>

          {/* Date Climbed */}
          <Text style={[styles.label, { color: colors.text }]}>Date Climbed *</Text>
          <TouchableOpacity
            onPress={() => setDatePickerVisible(true)}
            style={[styles.dateSelector, { backgroundColor: colors.surface, borderColor: colors.divider }]}
          >
            <Text style={[styles.dateSelectorText, { color: colors.text }]}>
              {formatDateDisplay(dateClimbed)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.textDim} />
          </TouchableOpacity>

          {/* Topped Checkbox */}
          <TouchableOpacity
            onPress={() => setTopped(!topped)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, { borderColor: colors.divider, backgroundColor: topped ? colors.accent : colors.surface }]}>
              {topped && <Ionicons name="checkmark" size={18} color="white" />}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>Topped (Successfully completed)</Text>
          </TouchableOpacity>

          {/* Attempts */}
          <Text style={[styles.label, { color: colors.text }]}>Attempts *</Text>
          <TextInput
            value={attempts}
            onChangeText={setAttempts}
            placeholder="Number of attempts"
            placeholderTextColor={colors.textDim}
            keyboardType="number-pad"
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.divider }]}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitBtn, { backgroundColor: submitting ? colors.surfaceAlt : colors.accent }]}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitText}>Log Climb</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setDatePickerVisible(false)}
        >
          <View style={[styles.datePickerContent, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <View style={[styles.datePickerHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.datePickerTitle, { color: colors.text }]}>Select Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Quick date options */}
            <View style={styles.quickDates}>
              <TouchableOpacity
                onPress={() => {
                  setDateClimbed(getTodayDate());
                  setDatePickerVisible(false);
                }}
                style={[styles.quickDateBtn, { backgroundColor: colors.surfaceAlt }]}
              >
                <Text style={[styles.quickDateText, { color: colors.text }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setDateClimbed(formatDateToYYYYMMDD(yesterday));
                  setDatePickerVisible(false);
                }}
                style={[styles.quickDateBtn, { backgroundColor: colors.surfaceAlt }]}
              >
                <Text style={[styles.quickDateText, { color: colors.text }]}>Yesterday</Text>
              </TouchableOpacity>
            </View>

            {/* Manual date input */}
            <View style={styles.manualDateInput}>
              <Text style={[styles.label, { color: colors.textDim }]}>Or enter manually (YYYY-MM-DD):</Text>
              <TextInput
                value={dateClimbed}
                onChangeText={setDateClimbed}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textDim}
                style={[styles.input, { color: colors.text, backgroundColor: colors.bg, borderColor: colors.divider }]}
              />
              <TouchableOpacity
                onPress={() => setDatePickerVisible(false)}
                style={[styles.datePickerDoneBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Crag Selection Modal */}
      <Modal
        visible={cragModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCragModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCragModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Crag</Text>
              <TouchableOpacity onPress={() => setCragModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {cragData.map((crag) => (
                <TouchableOpacity
                  key={crag.value}
                  style={[styles.modalItem, { borderBottomColor: colors.divider }]}
                  onPress={() => {
                    setSelectedCragKey(crag.value);
                    setSelectedRouteKey(''); // Reset route selection
                    setCragModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {crag.label}
                  </Text>
                  {selectedCragKey === crag.value && (
                    <Ionicons name="checkmark" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Route Selection Modal */}
      <Modal
        visible={routeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRouteModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRouteModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Route</Text>
              <TouchableOpacity onPress={() => setRouteModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {filteredRouteData.map((route) => (
                <TouchableOpacity
                  key={route.value}
                  style={[styles.modalItem, { borderBottomColor: colors.divider }]}
                  onPress={() => {
                    setSelectedRouteKey(route.value);
                    setRouteModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {route.label}
                  </Text>
                  {selectedRouteKey === route.value && (
                    <Ionicons name="checkmark" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function getTodayDate() {
  const today = new Date();
  return formatDateToYYYYMMDD(today);
}

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return 'Select date';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
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

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  dropdown: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderStyle: {
    fontSize: 15,
  },
  selectedTextStyle: {
    fontSize: 15,
  },
  dropdownContainer: {
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: 300,
  },
  dateSelector: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelectorText: {
    fontSize: 15,
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 15,
  },

  submitBtn: {
    marginTop: 24,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // Date picker styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerContent: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickDates: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickDateBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: 15,
    fontWeight: '600',
  },
  manualDateInput: {
    padding: 16,
    paddingTop: 0,
  },
  datePickerDoneBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerDoneText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalItemText: {
    fontSize: 16,
    flex: 1,
  },
});
