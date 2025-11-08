import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function RankingListScreen({ route, navigation }) {
  const { type, timeframe = 'all' } = route.params;
  const { colors } = useTheme();
  
  // Mock data for now - replace with actual API call later
  const [data] = useState([
    { id: '1', name: 'User 1', score: 150, rank: 1 },
    { id: '2', name: 'User 2', score: 145, rank: 2 },
    { id: '3', name: 'User 3', score: 140, rank: 3 },
    { id: '4', name: 'User 4', score: 135, rank: 4 },
    { id: '5', name: 'User 5', score: 130, rank: 5 },
  ]);

  const getDisplayTitle = (type) => {
    switch (type) {
      case 'mostClimbs':
        return 'Most Climbs';
      case 'highestBoulder':
        return 'Highest Average Grades';
      case 'topClimbers':
        return 'Top Climbers';
      default:
        return 'Rankings';
    }
  };

  const getMedalColor = (rank) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return colors.textDim;
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.rankingItem, { 
      backgroundColor: colors.surface,
      borderColor: colors.divider 
    }]}>
      <View style={styles.rankContainer}>
        {item.rank <= 3 ? (
          <Ionicons 
            name="medal" 
            size={32} 
            color={getMedalColor(item.rank)} 
          />
        ) : (
          <Text style={[styles.rankNumber, { color: colors.textDim }]}>
            {item.rank}
          </Text>
        )}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.userScore, { color: colors.textDim }]}>
          Score: {item.score}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.surface,
        borderBottomColor: colors.divider 
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {getDisplayTitle(type)}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Timeframe Badge */}
      <View style={styles.timeframeBadge}>
        <Text style={[styles.timeframeText, { color: colors.accent }]}>
          {timeframe === 'all' ? 'All Time' : timeframe === 'monthly' ? 'This Month' : 'This Week'}
        </Text>
      </View>

      {/* Rankings List */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  timeframeBadge: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userScore: {
    fontSize: 14,
  },
});
