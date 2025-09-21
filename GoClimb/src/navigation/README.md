# Navigation

This folder contains navigation setup and configuration.

## Files:
- `AppNavigator.js` - Main navigation container
- `AuthNavigator.js` - Authentication flow navigation
- `TabNavigator.js` - Bottom tab navigation

## Example:
```jsx
// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Your screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```