import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../constants/colors";

const RankingOptionsScreen = () => {
  const navigation = useNavigation();
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);
  
  // Animation values
  const headerOpacity = React.useRef(new Animated.Value(0)).current;
  const headerTranslateY = React.useRef(new Animated.Value(30)).current;
  const buttonsOpacity = React.useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate header entrance
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animate buttons entrance
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const timeframes = [
    { id: "today", label: "Today" },
    { id: "week", label: "Past week" },
    { id: "month", label: "Past month" },
    { id: "all", label: "All time" },
  ];

  const options = [
    { 
      id: "mostClimbs", 
      label: "Most Climbs",
      icon: "🧗",
      description: "Who logged the most sends",
      gradient: ['#00FF88', '#00CC66']
    },
    { 
      id: "highestBoulder", 
      label: "Highest Average Grades",
      icon: "📈",
      description: "Best mean grade across logs", 
      gradient: ['#FF6B6B', '#FF8E53']
    },
    { 
      id: "topClimbers", 
      label: "Top Climbers (By Grade)",
      icon: "🥇",
      description: "Best max grade achieved",
      gradient: ['#FFD93D', '#FF6B6B']
    },
  ];

  const handlePress = (type) => {
    navigation.navigate("RankingListScreen", { 
      type, 
      timeframe: selectedTimeframe 
    });
  };

  // Debug logging
  console.log('RankingOptionsScreen render - selectedTimeframe:', selectedTimeframe);

  return (
    <View style={styles.container}>
      {/* Enhanced Crag Background */}
      <View style={styles.backgroundPattern}>
        <View style={styles.rockTexture1} />
        <View style={styles.rockTexture2} />
        <View style={styles.rockTexture3} />
        <View style={styles.rockTexture4} />
        <View style={styles.rockTexture5} />
        {/* Additional climbing texture elements */}
        <View style={styles.climbingTexture1} />
        <View style={styles.climbingTexture2} />
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Animated Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }]
            }
          ]}
        >
          <Text style={styles.title}>🏆 Rankings</Text>
          <Text style={styles.subtitle}>View climbers by activity or grade</Text>
        </Animated.View>

        {/* Timeframe Selector */}
        <Animated.View 
          style={[
            styles.timeframeContainer,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }]
            }
          ]}
        >
          <Text style={styles.timeframeLabel}>Time Period:</Text>
          <TouchableOpacity
            style={styles.timeframeSelectorButton}
            onPress={() => setShowTimeframeModal(true)}
          >
            <Text style={styles.timeframeSelectorText}>
              {timeframes.find(t => t.id === selectedTimeframe)?.label || "All time"}
            </Text>
            <Text style={styles.timeframeSelectorArrow}>▼</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Enhanced Button Cards */}
        <Animated.View 
          style={[
            styles.cardsContainer,
            {
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsTranslateY }]
            }
          ]}
        >
          {options.map((item) => (
            <GradientButton
              key={item.id}
              option={item}
              onPress={() => handlePress(item.id)}
            />
          ))}
        </Animated.View>
      </ScrollView>

      {/* Timeframe Selection Modal */}
      <Modal
        visible={showTimeframeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeframeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowTimeframeModal(false)}
                style={styles.modalBackButton}
              >
                <Text style={styles.modalBackText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Time Period</Text>
              <TouchableOpacity
                onPress={() => setShowTimeframeModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Timeframe Options */}
            <ScrollView style={styles.modalContent}>
              {timeframes.map((timeframe) => (
                <TouchableOpacity
                  key={timeframe.id}
                  style={styles.modalOption}
                  onPress={() => {
                    console.log('Selected timeframe:', timeframe.id);
                    setSelectedTimeframe(timeframe.id);
                    setShowTimeframeModal(false);
                  }}
                >
                  <View style={[
                    styles.checkboxContainer,
                    selectedTimeframe === timeframe.id && styles.checkboxSelected
                  ]}>
                    {selectedTimeframe === timeframe.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.modalOptionText}>{timeframe.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const GradientButton = ({ option, onPress }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View 
      style={[
        styles.gradientButtonContainer,
        {
          transform: [{ scale }]
        }
      ]}
    >
      <View style={[styles.gradientBorder, { borderColor: option.gradient[0] }]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.gradientButton}
        >
          <View style={styles.buttonContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${option.gradient[0]}20` }]}>
              <Text style={styles.buttonIcon}>{option.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.buttonLabel}>{option.label}</Text>
              <Text style={styles.buttonDescription}>{option.description}</Text>
            </View>
            <Text style={[styles.buttonArrow, { color: option.gradient[0] }]}>›</Text>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B', // Dark base with gradient-like effect
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111D13', // Subtle green tint overlay
    opacity: 0.6,
  },
  rockTexture1: {
    position: 'absolute',
    top: '5%',
    left: '-5%',
    width: '45%',
    height: '60%',
    backgroundColor: 'rgba(90, 90, 90, 0.25)',
    borderRadius: 80,
    transform: [{ rotate: '15deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rockTexture2: {
    position: 'absolute',
    top: '20%',
    right: '-10%',
    width: '50%',
    height: '45%',
    backgroundColor: 'rgba(110, 110, 110, 0.2)',
    borderRadius: 70,
    transform: [{ rotate: '-25deg' }],
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  rockTexture3: {
    position: 'absolute',
    bottom: '10%',
    left: '20%',
    width: '60%',
    height: '40%',
    backgroundColor: 'rgba(75, 75, 75, 0.3)',
    borderRadius: 90,
    transform: [{ rotate: '20deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  rockTexture4: {
    position: 'absolute',
    top: '60%',
    right: '5%',
    width: '35%',
    height: '25%',
    backgroundColor: 'rgba(95, 95, 95, 0.18)',
    borderRadius: 45,
    transform: [{ rotate: '-35deg' }],
  },
  rockTexture5: {
    position: 'absolute',
    top: '0%',
    left: '40%',
    width: '40%',
    height: '30%',
    backgroundColor: 'rgba(85, 85, 85, 0.22)',
    borderRadius: 60,
    transform: [{ rotate: '45deg' }],
  },
  climbingTexture1: {
    position: 'absolute',
    top: '70%',
    left: '70%',
    width: '25%',
    height: '15%',
    backgroundColor: 'rgba(0, 255, 136, 0.08)',
    borderRadius: 30,
    transform: [{ rotate: '-15deg' }],
  },
  climbingTexture2: {
    position: 'absolute',
    top: '35%',
    left: '5%',
    width: '20%',
    height: '12%',
    backgroundColor: 'rgba(0, 204, 102, 0.06)',
    borderRadius: 25,
    transform: [{ rotate: '30deg' }],
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingTop: 60, // Account for status bar
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryGreen,
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 136, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },
  cardsContainer: {
    gap: 20,
    paddingHorizontal: 4,
  },
  gradientButtonContainer: {
    width: "100%",
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 2,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientButton: {
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonIcon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    opacity: 0.8,
  },
  buttonArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  timeframeContainer: {
    marginBottom: 32,
  },
  timeframeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  timeframeSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.primaryGreen,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    shadowColor: Colors.primaryGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  timeframeSelectorText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '500',
  },
  timeframeSelectorArrow: {
    fontSize: 12,
    color: Colors.primaryGreen,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1C1C1E', // Dark grey background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    minHeight: '40%',
    borderTopWidth: 2,
    borderTopColor: Colors.primaryGreen,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalBackButton: {
    padding: 4,
  },
  modalBackText: {
    fontSize: 24,
    color: Colors.primaryGreen,
    fontWeight: '300',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: Colors.primaryGreen,
    borderColor: Colors.primaryGreen,
    shadowColor: Colors.primaryGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  checkmark: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: 'bold',
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '500',
  },
});

export default RankingOptionsScreen;
