import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Colors from "../constants/colors";

const RankingOptionsScreen = () => {
  const navigation = useNavigation();

  const options = [
    { id: "mostClimbs", label: "Most Climbs" },
    { id: "highestBoulder", label: "Highest Average Grades" }, //for bouldering
    //{ id: "highestSport", label: "Highest Avg Grades (Sport)" }, //removed option
    { id: "topClimbers", label: "Top Climbers (By Grade)" },
  ];

  const handlePress = (type) => {
    navigation.navigate("RankingListScreen", { type });
  };

  return (
    <View style={styles.container}>
      {options.map((item) => (
        <AnimatedTouchable
          key={item.id}
          label={item.label}
          onPress={() => handlePress(item.id)}
        />
      ))}
    </View>
  );
};

const AnimatedTouchable = ({ label, onPress }) => {
  const scale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.button}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGrey,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  button: {
    width: "100%",
    borderColor: Colors.primaryGreen,
    borderWidth: 2,
    borderRadius: 15,
    paddingVertical: 16,
    marginVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RankingOptionsScreen;
