// GoClimb/src/components/TrendingCragCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { UI_CONSTANTS, STYLE_MIXINS, SCREEN_CONSTANTS } from '../constants';

export default function TrendingCragCard({ crag, onPress }) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}
      onPress={() => onPress?.(crag)}
    >
      {crag.images && crag.images.length > 0 ? (
        <Image
          source={{ uri: crag.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons 
            name="image-outline" 
            size={UI_CONSTANTS.ICON_SIZES.XLARGE} 
            color={colors.textDim} 
          />
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {crag.name}
        </Text>
        <View style={styles.stats}>
          <Ionicons name="trending-up" size={14} color="#4CAF50" />
          <Text style={styles.growth}>
            +{crag.growth} climbs
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_CONSTANTS.HOME_SCREEN.TRENDING_CARD_WIDTH,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MEDIUM,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...UI_CONSTANTS.SHADOWS.MEDIUM,
  },
  image: {
    width: '100%',
    height: SCREEN_CONSTANTS.HOME_SCREEN.TRENDING_IMAGE_HEIGHT,
  },
  imagePlaceholder: {
    width: '100%',
    height: SCREEN_CONSTANTS.HOME_SCREEN.TRENDING_IMAGE_HEIGHT,
    ...STYLE_MIXINS.flexCenter,
  },
  info: {
    padding: UI_CONSTANTS.SPACING.MD,
  },
  name: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  stats: {
    ...STYLE_MIXINS.flexRowCenter,
    gap: UI_CONSTANTS.SPACING.XS,
  },
  growth: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
    color: '#4CAF50',
  },
});