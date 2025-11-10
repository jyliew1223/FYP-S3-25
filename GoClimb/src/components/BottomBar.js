// GoClimb/src/components/BottomBar.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function BottomBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const nav = useNavigation();

  // Get current route name
  const currentRoute = state.routes[state.index];
  const currentRouteName = currentRoute?.name;

  // Show "Log a Climb" button only on these screens
  const showLogClimbButton = ['Home', 'Map', 'Routes'].includes(currentRouteName);

  const handleLogClimb = () => {
    nav.navigate('LogClimb');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, borderTopColor: colors.divider, paddingBottom: Math.max(insets.bottom, 6) }]}>
      {/* Log a Climb Button - Only on specific screens */}
      {showLogClimbButton && (
        <TouchableOpacity
          onPress={handleLogClimb}
          style={[styles.logClimbButton, { backgroundColor: colors.accent }]}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.logClimbText}>Log a Climb</Text>
        </TouchableOpacity>
      )}

      {/* Regular Tab Bar */}
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
  logClimbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logClimbText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 6 },
  txt: { fontSize: 11, fontWeight: '600' },
});
