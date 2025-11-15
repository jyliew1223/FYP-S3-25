// GoClimb/src/components/EmptyState.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { UI_CONSTANTS, STYLE_MIXINS } from '../constants';

export default function EmptyState({ 
  icon = 'information-circle-outline',
  title = 'No data available',
  subtitle = null,
  style = null 
}) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <Ionicons 
        name={icon} 
        size={UI_CONSTANTS.ICON_SIZES.XXLARGE} 
        color={colors.textDim} 
      />
      <Text style={[styles.title, { color: colors.textDim }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textDim }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...STYLE_MIXINS.flexCenter,
    padding: UI_CONSTANTS.SPACING.XL,
    gap: UI_CONSTANTS.SPACING.MD,
  },
  title: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.MEDIUM,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    textAlign: 'center',
    opacity: 0.8,
  },
});