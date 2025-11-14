// GoClimb/src/components/RankingCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { UI_CONSTANTS, STYLE_MIXINS } from '../constants';

export default function RankingCard({ 
  rankings = [], 
  onSeeMore = null,
  onUserPress = null,
  showSeeMore = true 
}) {
  const { colors } = useTheme();

  if (rankings.length === 0) {
    return null;
  }

  const getRankBadgeColor = (index) => {
    switch (index) {
      case 0: return UI_CONSTANTS.RANKING_COLORS.GOLD;
      case 1: return UI_CONSTANTS.RANKING_COLORS.SILVER;
      case 2: return UI_CONSTANTS.RANKING_COLORS.BRONZE;
      default: return colors.surfaceAlt;
    }
  };

  const getRankTextColor = (index) => {
    return index < 3 ? '#FFFFFF' : colors.text;
  };

  const getTrophyColor = (index) => {
    switch (index) {
      case 0: return UI_CONSTANTS.RANKING_COLORS.GOLD;
      case 1: return UI_CONSTANTS.RANKING_COLORS.SILVER;
      case 2: return UI_CONSTANTS.RANKING_COLORS.BRONZE;
      default: return colors.textDim;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
      {rankings.map((item, index) => (
        <TouchableOpacity
          key={item.user?.user_id || index}
          style={[
            styles.item,
            index < rankings.length - 1 && { 
              borderBottomWidth: StyleSheet.hairlineWidth, 
              borderBottomColor: colors.divider 
            }
          ]}
          onPress={() => onUserPress?.(item.user?.user_id)}
          disabled={!onUserPress}
        >
          <View style={styles.left}>
            <View style={[
              styles.rankBadge,
              { backgroundColor: getRankBadgeColor(index) }
            ]}>
              <Text style={[
                styles.rankNumber,
                {
                  color: getRankTextColor(index),
                  fontWeight: index < 3 ? UI_CONSTANTS.FONT_WEIGHTS.EXTRABOLD : UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD
                }
              ]}>
                {item.rank || index + 1}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
                {item.user?.username || 'Unknown User'}
              </Text>
              <Text style={[styles.climbs, { color: colors.textDim }]}>
                {item.total_routes || 0} {(item.total_routes || 0) === 1 ? 'climb' : 'climbs'}
              </Text>
            </View>
          </View>
          {index < 3 && (
            <Ionicons
              name="trophy"
              size={UI_CONSTANTS.ICON_SIZES.MEDIUM}
              color={getTrophyColor(index)}
            />
          )}
        </TouchableOpacity>
      ))}
      
      {showSeeMore && onSeeMore && (
        <TouchableOpacity style={styles.seeMoreButton} onPress={onSeeMore}>
          <Text style={[styles.seeMoreText, { color: colors.accent }]}>
            ...tap to see more
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={UI_CONSTANTS.ICON_SIZES.SMALL} 
            color={colors.accent} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: UI_CONSTANTS.SPACING.LG,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MEDIUM,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...UI_CONSTANTS.SHADOWS.MEDIUM,
  },
  item: {
    ...STYLE_MIXINS.flexRowCenter,
    justifyContent: 'space-between',
    padding: UI_CONSTANTS.SPACING.MD,
  },
  left: {
    ...STYLE_MIXINS.flexRowCenter,
    flex: 1,
    gap: UI_CONSTANTS.SPACING.MD,
  },
  rankBadge: {
    width: UI_CONSTANTS.SCREEN_CONSTANTS?.HOME_SCREEN?.RANK_BADGE_SIZE || 32,
    height: UI_CONSTANTS.SCREEN_CONSTANTS?.HOME_SCREEN?.RANK_BADGE_SIZE || 32,
    borderRadius: (UI_CONSTANTS.SCREEN_CONSTANTS?.HOME_SCREEN?.RANK_BADGE_SIZE || 32) / 2,
    ...STYLE_MIXINS.flexCenter,
  },
  rankNumber: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
  },
  username: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
    marginBottom: 2,
  },
  climbs: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
  },
  seeMoreButton: {
    ...STYLE_MIXINS.flexRowCenter,
    justifyContent: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    gap: UI_CONSTANTS.SPACING.XS,
  },
  seeMoreText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM + 1,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
    fontStyle: 'italic',
  },
});