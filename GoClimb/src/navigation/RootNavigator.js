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
import BottomBar from '../components/BottomBar';
import Routes from '../screens/Routes';
import RouteDetails from '../screens/RouteDetails';
import AR from '../screens/AR';
import PostDetail from '../screens/PostDetail';
import Forum from '../screens/Forum';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <BottomBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Rankings" component={SettingsScreen} options={{ title: 'Rankings' }} />
      <Tab.Screen name="Map" component={SettingsScreen} />
      <Tab.Screen name="Forum" component={Forum} />
      <Tab.Screen name="Routes" component={Routes} />
    </Tab.Navigator>
  );
}

export default function RootNavigator({ navTheme }) {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RouteDetails" component={RouteDetails} />
        <Stack.Screen name="AR" component={AR} />
        <Stack.Screen name="PostDetail" component={PostDetail} />
        <Stack.Screen name="Forum" component={Forum} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
