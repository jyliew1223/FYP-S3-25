// GoClimb/src/navigation/RootNavigator.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LogInScreen';
import PreSignUpScreen from '../screens/PreSignUpScreen';
import PaymentScreen from '../screens/PaymentScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MapScreen from '../screens/MapScreen';
import BottomBar from '../components/BottomBar';
import CragsScreen from '../screens/CragsScreen';
import RouteDetails from '../screens/RouteDetails';
import ARCragList from '../screens/ARCragList';
import UnityARScreen from '../screens/UnityARScreen';
import UnityOutdoorARScreen from '../screens/UnityOutdoorARScreen';

import Forum from '../screens/Forum';
import PostDetail from '../screens/PostDetail';
import CreatePostScreen from '../screens/CreatePostScreen';
import RouteDataManager from '../screens/RouteDataManager';
import RankingOptionsScreen from '../screens/RankingOptionsScreen';
import RankingListScreen from '../screens/RankingListScreen';
import ModelManagementScreen from '../screens/ModelManagementScreen';
import LogClimbScreen from '../screens/LogClimbScreen';
import FAQScreen from '../screens/FAQScreen';
import CreateCragRouteScreen from '../screens/CreateCragRouteScreen';

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
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="PreSignUp" component={PreSignUpScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Ranking-related */}
        <Stack.Screen
          name="RankingList"
          component={RankingListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ARCragList" 
          component={ARCragList}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="UnityAR" 
          component={UnityARScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: false,
            animation: 'fade'
          }}
        />
        <Stack.Screen 
          name="UnityOutdoorAR" 
          component={UnityOutdoorARScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: false,
            animation: 'fade'
          }}
        />

        {/* Forum-related */}
        <Stack.Screen name="PostDetail" component={PostDetail} />
        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
          options={{ headerShown: false }}
        />
        
        {/* Climb Log */}
        <Stack.Screen
          name="LogClimb"
          component={LogClimbScreen}
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
        <Stack.Screen
          name="RouteDataManager"
          component={RouteDataManager}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ModelManagement"
          component={ModelManagementScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FAQ"
          component={FAQScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateCragRoute"
          component={CreateCragRouteScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
