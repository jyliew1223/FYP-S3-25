// GoClimb/src/components/DrawerItem.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { UI_CONSTANTS, STYLE_MIXINS } from '../constants';

export default function DrawerItem({ 
  icon, 
  label, 
  onPress, 
  iconSize = UI_CONSTANTS.ICON_SIZES.MEDIUM,
  style = null 
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.item, style]}
    >
      <Ionicons 
        name={icon} 
        size={iconSize} 
        color={colors.text} 
        style={styles.icon} 
      />
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    ...STYLE_MIXINS.flexRowCenter,
    paddingVertical: 14,
  },
  icon: {
    marginRight: UI_CONSTANTS.SPACING.MD,
  },
  label: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
  },
});