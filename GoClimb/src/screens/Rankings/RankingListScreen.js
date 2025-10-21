import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors'; // use existing colors file

export default function RankingListScreen({ route, navigation }) {
  const { type } = route.params; //  "most_climbs", "highest_grades"
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await fetch(`https://your-backend-url.com/api/rankings/${type}`); // Replace with backend URL
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error fetching rankings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [type]);

  const renderItem = ({ item, index }) => (
    <Pressable
      onPress={() => navigation.navigate('CragDetail', { cragId: item.cragId })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.darkGrey,
        borderBottomColor: colors.green,
        borderBottomWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/80' }}
        style={{
          width: 70,
          height: 70,
          borderRadius: 12,
          marginRight: 16,
          borderWidth: 1,
          borderColor: colors.green,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.white, fontSize: 17, fontWeight: '600' }}>{item.name}</Text>
        <Text style={{ color: colors.green, fontSize: 15, marginTop: 4 }}>
          {item.routesCount} Routes
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.darkGrey }}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.green} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}
// constants/colors.js