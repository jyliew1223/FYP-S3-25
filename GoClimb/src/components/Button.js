// GoClimb/src/components/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { UI_CONSTANTS, STYLE_MIXINS } from '../constants';

export default function Button({ 
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost'
  size = 'medium', // 'small', 'medium', 'large'
  icon = null,
  iconPosition = 'left', // 'left', 'right'
  loading = false,
  disabled = false,
  style = null,
  textStyle = null,
}) {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: UI_CONSTANTS.BORDER_RADIUS.SMALL,
      ...STYLE_MIXINS.flexRowCenter,
      justifyContent: 'center',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = UI_CONSTANTS.SPACING.SM;
        baseStyle.paddingVertical = UI_CONSTANTS.SPACING.XS;
        baseStyle.minHeight = 32;
        break;
      case 'large':
        baseStyle.paddingHorizontal = UI_CONSTANTS.SPACING.XL;
        baseStyle.paddingVertical = UI_CONSTANTS.SPACING.LG;
        baseStyle.minHeight = 48;
        break;
      default: // medium
        baseStyle.paddingHorizontal = UI_CONSTANTS.SPACING.LG;
        baseStyle.paddingVertical = UI_CONSTANTS.SPACING.MD;
        baseStyle.minHeight = 40;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.surfaceAlt,
          borderWidth: 1,
          borderColor: colors.divider,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.accent,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default: // primary
        return {
          ...baseStyle,
          backgroundColor: colors.accent,
          ...UI_CONSTANTS.SHADOWS.SMALL,
        };
    }
  };

  const getTextStyle = () => {
    const baseStyle = {
      fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.fontSize = UI_CONSTANTS.FONT_SIZES.SM;
        break;
      case 'large':
        baseStyle.fontSize = UI_CONSTANTS.FONT_SIZES.XL;
        break;
      default: // medium
        baseStyle.fontSize = UI_CONSTANTS.FONT_SIZES.LG;
    }

    // Variant styles
    switch (variant) {
      case 'outline':
        baseStyle.color = colors.accent;
        break;
      case 'ghost':
        baseStyle.color = colors.accent;
        break;
      case 'secondary':
        baseStyle.color = colors.text;
        break;
      default: // primary
        baseStyle.color = '#FFFFFF';
    }

    return baseStyle;
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return UI_CONSTANTS.ICON_SIZES.SMALL;
      case 'large':
        return UI_CONSTANTS.ICON_SIZES.LARGE;
      default:
        return UI_CONSTANTS.ICON_SIZES.MEDIUM;
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        isDisabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#FFFFFF' : colors.accent} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={getIconSize()} 
              color={getTextStyle().color}
              style={{ marginRight: title ? UI_CONSTANTS.SPACING.XS : 0 }}
            />
          )}
          {title && (
            <Text style={[getTextStyle(), textStyle]}>
              {title}
            </Text>
          )}
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={getIconSize()} 
              color={getTextStyle().color}
              style={{ marginLeft: title ? UI_CONSTANTS.SPACING.XS : 0 }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});