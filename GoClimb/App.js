// GoClimb/App.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import InitFirebaseApps from './src/services/firebase/InitFirebaseApps';
import { STRIPE_CONFIG } from './src/config/stripe';



function AppInner() {
  const { navTheme } = useTheme();
  return <RootNavigator navTheme={navTheme} />;
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await InitFirebaseApps();
      } catch (err) {
        console.error('App initialization failed:', err);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // render your app after initialization
  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_CONFIG.PUBLISHABLE_KEY}>
        <ThemeProvider>
          <AuthProvider>
            {/* <UnityViewer showTestButton={true} />
            <ModelPicker cragId={someCragId} /> */}
            <AppInner />
          </AuthProvider>
        </ThemeProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
