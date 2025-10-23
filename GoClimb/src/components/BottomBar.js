// GoClimb/src/components/BottomBar.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function BottomBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, borderTopColor: colors.divider, paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;

          const iconName =
            options.tabBarIconName ||
            ({
              Home: 'home',
              Rankings: 'trophy',
              Map: 'map',
              Forum: 'chatbubbles',
              Routes: 'flag',
            }[label] || 'ellipse');

          const onPress = () => {
            if (!focused) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.item}>
              <Ionicons name={iconName} size={20} color={focused ? colors.accent : colors.textDim} />
              <Text style={[styles.txt, { color: focused ? colors.accent : colors.textDim }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 6 },
  txt: { fontSize: 11, fontWeight: '600' },
});