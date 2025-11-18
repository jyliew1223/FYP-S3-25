// GoClimb/src/components/Card.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { UI_CONSTANTS, STYLE_MIXINS } from '../constants';

export default function Card({ 
  children, 
  style = null,
  padding = UI_CONSTANTS.SPACING.MD,
  margin = 0,
  shadow = 'medium' // 'small', 'medium', 'large', 'none'
}) {
  const { colors } = useTheme();

  const getShadowStyle = () => {
    switch (shadow) {
      case 'small':
        return UI_CONSTANTS.SHADOWS.SMALL;
      case 'large':
        return UI_CONSTANTS.SHADOWS.LARGE;
      case 'none':
        return {};
      default:
        return UI_CONSTANTS.SHADOWS.MEDIUM;
    }
  };

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.surface,
        borderColor: colors.divider,
        padding: padding,
        margin: margin,
      },
      getShadowStyle(),
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MEDIUM,
    borderWidth: StyleSheet.hairlineWidth,
  },
});