// GoClimb/src/navigation/RootNavigator.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LogInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MapScreen from '../screens/MapScreen';
import BottomBar from '../components/BottomBar';
import CragsScreen from '../screens/CragsScreen';
import RouteDetails from '../screens/RouteDetails';
import AR from '../screens/AR';

import Forum from '../screens/Forum';
import PostDetail from '../screens/PostDetail';
import CreatePostScreen from '../screens/CreatePostScreen';
import RankingOptionsScreen from '../screens/RankingOptionsScreen';
import RankingListScreen from '../screens/RankingListScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Rankings"
        component={RankingOptionsScreen}
        options={{ title: 'Rankings' }}
      />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen
        name="ForumMain"
        component={Forum}
        options={{ title: 'Forum' }}
      />
      <Tab.Screen
        name="Routes"
        component={CragsScreen}
        options={{ title: 'Routes' }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root stack above the tabs.
 * Screens here can open modally above the tab bar.
 */
export default function RootNavigator({ navTheme }) {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Tabs as the app root */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* General profile / auth / misc */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AR" component={AR} />

        {/* Ranking-related */}
        <Stack.Screen
          name="RankingList"
          component={RankingListScreen}
          options={{ headerShown: false }}
        />

        {/* Forum-related */}
        <Stack.Screen name="PostDetail" component={PostDetail} />
        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Crags"
          component={CragsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RouteDetails"
          component={RouteDetails}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
