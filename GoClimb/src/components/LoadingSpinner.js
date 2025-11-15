// GoClimb/src/components/LoadingSpinner.js
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { UI_CONSTANTS, STYLE_MIXINS } from '../constants';

export default function LoadingSpinner({ 
  size = 'large', 
  text = null, 
  style = null,
  color = null 
}) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator 
        size={size} 
        color={color || colors.accent} 
      />
      {text && (
        <Text style={[styles.text, { color: colors.textDim }]}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...STYLE_MIXINS.flexCenter,
    padding: UI_CONSTANTS.SPACING.XL,
  },
  text: {
    marginTop: UI_CONSTANTS.SPACING.SM,
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
  },
});