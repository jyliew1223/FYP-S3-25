import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { 
  fetchWeeklyUserRankings,
  fetchMonthlyUserRankings, 
  fetchAllTimeUserRankings,
  fetchAverageGradeRankings,
  fetchTopClimbers,
  formatRankingsForDisplay 
} from '../services/api/RankingsService';

export default function RankingListScreen({ route, navigation }) {
  const { type, timeframe = 'all' } = route.params;
  const { colors } = useTheme();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRankings();
  }, [type, timeframe]);

  const loadRankings = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;

      // Handle different ranking types
      if (type === 'mostClimbs') {
        // Most Climbs rankings
        if (timeframe === 'weekly') {
          result = await fetchWeeklyUserRankings(50);
        } else if (timeframe === 'monthly') {
          result = await fetchMonthlyUserRankings(50);
        } else if (timeframe === 'all') {
          result = await fetchAllTimeUserRankings(50);
        }
      } else if (type === 'highestBoulder') {
        // Average Grade rankings
        const apiTimeframe = timeframe === 'all' ? 'alltime' : timeframe;
        result = await fetchAverageGradeRankings(50, apiTimeframe);
      } else if (type === 'topClimbers') {
        // Top Climbers rankings
        const apiTimeframe = timeframe === 'all' ? 'alltime' : timeframe;
        result = await fetchTopClimbers(50, apiTimeframe);
      }

      if (result && result.success) {
        const formatted = formatRankingsForDisplay(result.data, type);
        setData(formatted);
      } else {
        setError(result?.message || 'Failed to load rankings');
      }
    } catch (err) {
      console.error('[RankingListScreen] Error loading rankings:', err);
      setError('Failed to load rankings');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUserPress = (userId) => {
    if (userId) {
      navigation.navigate('Profile', { userId });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.rankingItem, { 
        backgroundColor: colors.surface,
        borderColor: colors.divider 
      }]}
      onPress={() => handleUserPress(item.userId)}
      activeOpacity={0.7}
    >
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

      {/* Profile Picture */}
      <View style={[styles.avatarContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.divider }]}>
        {item.profilePicture ? (
          <Image 
            source={{ uri: item.profilePicture }} 
            style={styles.avatar}
          />
        ) : (
          <Ionicons name="person" size={20} color={colors.textDim} />
        )}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.userScore, { color: colors.textDim }]}>
          {item.score} {item.scoreLabel}
        </Text>
        {item.secondaryInfo && (
          <Text style={[styles.secondaryInfo, { color: colors.textDim }]}>
            {item.secondaryInfo}
          </Text>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
    </TouchableOpacity>
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
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textDim }]}>
            Loading rankings...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textDim} />
          <Text style={[styles.errorText, { color: colors.textDim }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
            onPress={loadRankings}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="trophy-outline" size={64} color={colors.textDim} />
          <Text style={[styles.emptyText, { color: colors.textDim }]}>
            No rankings available yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
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
  secondaryInfo: {
    fontSize: 12,
    marginTop: 2,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
