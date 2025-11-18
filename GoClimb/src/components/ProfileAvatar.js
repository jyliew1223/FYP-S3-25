// GoClimb/src/components/ProfileAvatar.js
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { UI_CONSTANTS, STYLE_MIXINS } from '../constants';

export default function ProfileAvatar({ 
  imageUrl = null,
  username = null,
  size = 40,
  showFallback = true,
  style = null 
}) {
  const { colors } = useTheme();

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (imageUrl) {
    return (
      <Image 
        source={{ uri: imageUrl }} 
        style={[avatarStyle, style]}
      />
    );
  }

  if (!showFallback) {
    return null;
  }

  return (
    <View style={[
      styles.fallback, 
      avatarStyle, 
      { backgroundColor: colors.surfaceAlt },
      style
    ]}>
      {username ? (
        <Text style={[
          styles.fallbackText, 
          { 
            color: colors.text,
            fontSize: size * 0.4,
          }
        ]}>
          {username.charAt(0).toUpperCase()}
        </Text>
      ) : (
        <Ionicons 
          name="person" 
          size={size * 0.5} 
          color={colors.text} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    ...STYLE_MIXINS.flexCenter,
    overflow: 'hidden',
  },
  fallbackText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
  },
});