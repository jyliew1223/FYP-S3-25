import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { RankingService } from '../../services/api/RankingService';

export default function RankingListScreen({ route, navigation }) {
  const { type, timeframe = 'all' } = route.params;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Animation values
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const listAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Function to get display title based on type
  const getDisplayTitle = (type) => {
    switch (type) {
      case 'mostClimbs':
        return 'Most Climbs';
      case 'highestBoulder':
        return 'Highest Average Grades';
      case 'topClimbers':
        return 'Top Climbers (By Grade)';
      default:
        return 'Rankings';
    }
  };

  // Function to get icon based on type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'mostClimbs':
        return '🧗';
      case 'highestBoulder':
        return '📈';
      case 'topClimbers':
        return '🏆';
      default:
        return '🏅';
    }
  };

  // Function to get theme color based on type
  const getThemeColor = (type) => {
    switch (type) {
      case 'mostClimbs':
        return '#00FF88';
      case 'highestBoulder':
        return '#FF6B6B';
      case 'topClimbers':
        return '#FFD93D';
      default:
        return colors.green;
    }
  };

  // Function to get stats text based on ranking type
  const getStatsText = (item, type) => {
    switch (type) {
      case 'mostClimbs':
        return `${item.totalClimbs || item.routesCount || 0} Climbs`;
      case 'highestBoulder':
        return `${item.averageGrade || 'N/A'} Avg Grade`;
      case 'topClimbers':
        return `${item.maxGrade || 'N/A'} Max Grade`;
      default:
        return `${item.routesCount || 0} Routes`;
    }
  };

  // Function to get medal emoji for top positions
  const getMedalEmoji = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return null;
    }
  };

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching rankings for type: ${type}, timeframe: ${timeframe}`);

        // Call the backend using RankingService
        const response = await RankingService.getRanking(type, timeframe);

        if (response.success) {
          console.log(`Successfully fetched ${response.rankings.length} rankings`);
          setData(response.rankings);
          
          // Animate list entrance
          Animated.sequence([
            Animated.timing(listAnimation, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          console.error('Failed to fetch rankings:', response.message);

          // Check if it's an App Check error
          if (response.message && response.message.includes('AppCheck')) {
            setError('Firebase configuration issue. Please contact support.');
          } else if (response.status === 404) {
            setError('Ranking endpoint not found. Please check backend configuration.');
          } else if (response.status === 0) {
            setError('Cannot connect to server. Please check your internet connection.');
          } else {
            setError(response.message || 'Failed to fetch rankings');
          }

          setData([]);
        }
      } catch (err) {
        console.error('Error fetching rankings:', err);

        // Check for specific error types
        if (err.message && err.message.includes('AppCheck')) {
          setError('Firebase App Check error. Trying alternative connection...');
        } else if (err.message && err.message.includes('Network')) {
          setError('Network connection failed. Please check your internet.');
        } else {
          setError(`Unexpected error: ${err.message}`);
        }

        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
    
    // Animate header entrance
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [type, timeframe]);

  const RankingItem = ({ item, index }) => {
    const itemAnimation = useRef(new Animated.Value(0)).current;
    const scaleAnimation = useRef(new Animated.Value(1)).current;
    const themeColor = getThemeColor(type);
    const medal = getMedalEmoji(index);

    useEffect(() => {
      Animated.timing(itemAnimation, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    const handlePressIn = () => {
      Animated.spring(scaleAnimation, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnimation, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={{
          opacity: itemAnimation,
          transform: [
            { scale: scaleAnimation },
            {
              translateY: itemAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        }}
      >
        <Pressable
          onPress={() => navigation.navigate('ProfileScreen', { userId: item.userId })}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(28, 28, 30, 0.9)',
            marginHorizontal: 12,
            marginVertical: 6,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: index < 3 ? `${themeColor}40` : 'rgba(255, 255, 255, 0.1)',
            shadowColor: index < 3 ? themeColor : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: index < 3 ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: index < 3 ? 8 : 4,
          }}
        >
          {/* Enhanced Ranking Position */}
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: index < 3 ? `${themeColor}20` : 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2,
            borderColor: index < 3 ? themeColor : colors.textSecondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
          }}>
            {medal ? (
              <Text style={{ fontSize: 20 }}>{medal}</Text>
            ) : (
              <Text style={{
                color: index < 3 ? themeColor : colors.white,
                fontSize: 18,
                fontWeight: 'bold',
              }}>
                {index + 1}
              </Text>
            )}
          </View>

          {/* Enhanced Profile Image */}
          <View style={{
            position: 'relative',
            marginRight: 16,
          }}>
            <Image
              source={{ uri: item.image || 'https://via.placeholder.com/80' }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                borderWidth: 2,
                borderColor: index < 3 ? themeColor : colors.green,
              }}
            />
            {index < 3 && (
              <View style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: themeColor,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 10, color: '#000' }}>★</Text>
              </View>
            )}
          </View>

          {/* Enhanced Content */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ 
                color: colors.white, 
                fontSize: 18, 
                fontWeight: '700',
                flex: 1,
              }}>
                {item.name || 'Unknown User'}
              </Text>
              {index < 5 && (
                <View style={{
                  backgroundColor: `${themeColor}20`,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: `${themeColor}40`,
                }}>
                  <Text style={{ 
                    color: themeColor, 
                    fontSize: 10, 
                    fontWeight: '600' 
                  }}>
                    TOP {index + 1}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ 
                color: themeColor, 
                fontSize: 16, 
                fontWeight: '600',
                marginRight: 8,
              }}>
                {getStatsText(item, type)}
              </Text>
              <View style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.textSecondary,
                marginRight: 8,
              }} />
              <Text style={{ 
                color: colors.textSecondary, 
                fontSize: 12,
                fontStyle: 'italic',
              }}>
                {timeframe === 'today' ? 'Today' : 
                 timeframe === 'week' ? 'This Week' :
                 timeframe === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </View>
          </View>

          {/* Arrow Indicator */}
          <View style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: `${themeColor}15`,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ 
              color: themeColor, 
              fontSize: 16, 
              fontWeight: 'bold' 
            }}>
              ›
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderItem = ({ item, index }) => (
    <RankingItem item={item} index={index} />
  );

  const themeColor = getThemeColor(type);

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0B' }}>
      {/* Enhanced Dynamic Background */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#111D13',
        opacity: 0.4,
      }}>
        {/* Dynamic theme-colored accents */}
        <View style={{
          position: 'absolute',
          top: '10%',
          right: '-10%',
          width: '60%',
          height: '30%',
          backgroundColor: `${themeColor}15`,
          borderRadius: 80,
          transform: [{ rotate: '-20deg' }],
        }} />
        <View style={{
          position: 'absolute',
          bottom: '20%',
          left: '-10%',
          width: '50%',
          height: '35%',
          backgroundColor: `${themeColor}10`,
          borderRadius: 70,
          transform: [{ rotate: '25deg' }],
        }} />
        
        {/* Static rock textures */}
        <View style={{
          position: 'absolute',
          top: '40%',
          left: '60%',
          width: '35%',
          height: '20%',
          backgroundColor: 'rgba(105, 105, 105, 0.15)',
          borderRadius: 50,
          transform: [{ rotate: '-35deg' }],
        }} />
        <View style={{
          position: 'absolute',
          top: '60%',
          left: '5%',
          width: '30%',
          height: '15%',
          backgroundColor: 'rgba(85, 85, 85, 0.2)',
          borderRadius: 40,
          transform: [{ rotate: '40deg' }],
        }} />
        
        {/* Climbing-themed elements */}
        <View style={{
          position: 'absolute',
          top: '75%',
          right: '10%',
          width: '25%',
          height: '12%',
          backgroundColor: `${themeColor}08`,
          borderRadius: 30,
          transform: [{ rotate: '-10deg' }],
        }} />
      </View>

      {/* Enhanced Animated Header */}
      <Animated.View style={{
        backgroundColor: 'rgba(11, 11, 11, 0.95)',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 2,
        borderBottomColor: `${themeColor}40`,
        shadowColor: themeColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        opacity: headerAnimation,
        transform: [{
          translateY: headerAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          }),
        }],
      }}>
        {/* Header Row with Back Button and Title */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 5,
          marginBottom: 15,
        }}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: `${themeColor}20`,
              borderWidth: 1,
              borderColor: `${themeColor}40`,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <Text style={{
              color: themeColor,
              fontSize: 20,
              fontWeight: 'bold',
            }}>‹</Text>
          </TouchableOpacity>

          {/* Title Section */}
          <View style={{ flex: 1, alignItems: 'center', marginRight: 56 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 28, marginRight: 8 }}>{getTypeIcon(type)}</Text>
              <Text style={{
                color: colors.white,
                fontSize: 22,
                fontWeight: '700',
                textShadowColor: `${themeColor}40`,
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
                textAlign: 'center',
              }}>
                {getDisplayTitle(type)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Badge - Centered */}
        <View style={{ alignItems: 'center' }}>
          <View style={{
            backgroundColor: `${themeColor}15`,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: `${themeColor}30`,
          }}>
            <Text style={{
              color: themeColor,
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'uppercase',
            }}>
              {timeframe === 'today' ? 'Today' : 
               timeframe === 'week' ? 'This Week' :
               timeframe === 'month' ? 'This Month' : 'All Time'} • {data.length} Climbers
            </Text>
          </View>
        </View>
      </Animated.View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: `${themeColor}20`,
            borderWidth: 2,
            borderColor: `${themeColor}40`,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <ActivityIndicator size="large" color={themeColor} />
          </View>
          <Text style={{ 
            color: colors.white, 
            fontSize: 18, 
            fontWeight: '600',
            marginBottom: 8,
          }}>
            Loading Rankings
          </Text>
          <Text style={{ 
            color: colors.textSecondary, 
            fontSize: 14,
            textAlign: 'center',
          }}>
            Fetching the best climbers...
          </Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>😔</Text>
          <Text style={{ 
            color: colors.white, 
            fontSize: 20, 
            fontWeight: '600',
            textAlign: 'center', 
            marginBottom: 12,
          }}>
            Oops! Something went wrong
          </Text>
          <Text style={{ 
            color: colors.textSecondary, 
            fontSize: 14, 
            textAlign: 'center', 
            marginBottom: 30,
            lineHeight: 20,
          }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              const fetchRankings = async () => {
                try {
                  setLoading(true);
                  setError(null);
                  const response = await RankingService.getRanking(type, timeframe);
                  if (response.success) {
                    setData(response.rankings);
                  } else {
                    setError(response.message || 'Failed to fetch rankings');
                    setData([]);
                  }
                } catch (err) {
                  setError('Network error occurred');
                  setData([]);
                } finally {
                  setLoading(false);
                }
              };
              fetchRankings();
            }}
            style={{
              backgroundColor: themeColor,
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
              shadowColor: themeColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Text style={{ 
              color: '#000', 
              fontSize: 16, 
              fontWeight: '700' 
            }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : data.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 64, marginBottom: 20 }}>🏔️</Text>
          <Text style={{ 
            color: colors.white, 
            fontSize: 20, 
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 12,
          }}>
            No Rankings Yet
          </Text>
          <Text style={{ 
            color: colors.textSecondary, 
            fontSize: 14, 
            textAlign: 'center',
            lineHeight: 20,
          }}>
            Be the first to climb and make it to the leaderboard!
          </Text>
        </View>
      ) : (
        <Animated.View style={{ 
          flex: 1,
          opacity: listAnimation,
          transform: [{
            translateY: listAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          }],
        }}>
          <FlatList
            data={data}
            keyExtractor={(item) => (item.id || item.userId || Math.random()).toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingTop: 20,
              paddingBottom: 40,
            }}
            style={{ backgroundColor: 'transparent' }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          />
        </Animated.View>
      )}
    </View>
  );
}
