// src/components/SystemUIToggle.js
import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SystemUIManager from '../utils/SystemUIManager';

const SystemUIToggle = ({ 
  size = 24, 
  color = '#FFFFFF', 
  style = {},
  onPress = null 
}) => {
  const handlePress = () => {
    if (Platform.OS === 'android') {
      SystemUIManager.toggleSystemUI();
    }
    
    // Call custom onPress if provided
    if (onPress) {
      onPress();
    }
  };

  // Only render on Android
  if (Platform.OS !== 'android') {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        {
          padding: 8,
          borderRadius: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        },
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={SystemUIManager.isHidden ? "expand" : "contract"} 
        size={size} 
        color={color} 
      />
    </TouchableOpacity>
  );
};

export default SystemUIToggle;