import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import Ionicons from 'react-native-vector-icons/Ionicons';

const RankingOptionsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);

  const timeframeOptions = [
    { value: "all", label: "All Time" },
    { value: "monthly", label: "This Month" },
    { value: "weekly", label: "This Week" },
  ];

  const rankingOptions = [
    {
      type: "mostClimbs",
      title: "Most Climbs",
      description: "Climbers with the most routes completed",
      icon: "trending-up",
    },
    {
      type: "highestBoulder",
      title: "Highest Average Grades",
      description: "Climbers with the best average grades",
      icon: "bar-chart",
    },
    {
      type: "topClimbers",
      title: "Top Climbers",
      description: "Overall top performers by grade",
      icon: "trophy",
    },
  ];

  const handleRankingSelect = (type) => {
    navigation.navigate("RankingList", {
      type,
      timeframe: selectedTimeframe,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.accent }]}>Rankings</Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>
            Choose a ranking category to view
          </Text>
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeContainer}>
          <Text style={[styles.timeframeLabel, { color: colors.text }]}>
            Timeframe
          </Text>
          <TouchableOpacity
            style={[styles.timeframeSelectorButton, { 
              backgroundColor: colors.surface,
              borderColor: colors.accent 
            }]}
            onPress={() => setShowTimeframeModal(true)}
          >
            <Text style={[styles.timeframeSelectorText, { color: colors.text }]}>
              {timeframeOptions.find((opt) => opt.value === selectedTimeframe)?.label}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Ranking Options */}
        <View style={styles.cardsContainer}>
          {rankingOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[styles.rankingCard, { 
                backgroundColor: colors.surface,
                borderColor: colors.divider 
              }]}
              onPress={() => handleRankingSelect(option.type)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name={option.icon} size={28} color={colors.accent} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.buttonLabel, { color: colors.text }]}>
                  {option.title}
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textDim }]}>
                  {option.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textDim} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Timeframe Modal */}
      <Modal
        visible={showTimeframeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeframeModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowTimeframeModal(false)}
        >
          <View style={[styles.modalContainer, { 
            backgroundColor: colors.surface,
            borderTopColor: colors.accent 
          }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Timeframe
              </Text>
              <TouchableOpacity onPress={() => setShowTimeframeModal(false)}>
                <Ionicons name="close" size={24} color={colors.textDim} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              {timeframeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.modalOption, { borderBottomColor: colors.divider }]}
                  onPress={() => {
                    setSelectedTimeframe(option.value);
                    setShowTimeframeModal(false);
                  }}
                >
                  <View
                    style={[
                      styles.checkboxContainer,
                      { borderColor: colors.divider },
                      selectedTimeframe === option.value && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    {selectedTimeframe === option.value && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  timeframeContainer: {
    marginBottom: 24,
  },
  timeframeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  timeframeSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timeframeSelectorText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cardsContainer: {
    gap: 16,
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    borderTopWidth: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default RankingOptionsScreen;
