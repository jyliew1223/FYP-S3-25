/**
 * Sample React Native App (Converted to JavaScript)
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Button,
  NativeModules,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import FirebaseStatusCheck from './src/services/firebase/FirebaseStatusCheck';
import AppCheckStatusCheck from './src/services/firebase/AppCheckStatusCheck';
import InitFirebaseApps from './src/services/firebase/InitFirebaseApps';

// Main component, functionally identical to the TypeScript version
function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      {/* Set the status bar style based on the system theme */}
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

const { UnityModule } = NativeModules;

// Separate component to utilize the useSafeAreaInsets hook
function AppContent() {
  // Get safe area insets (padding required for notches/dynamic island, etc.)
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Button
        title="Open Unity"
        onPress={() => {
          UnityModule.openUnity();
        }}
      />

      <FirebaseStatusCheck />

      <AppCheckStatusCheck />

      <View style={{ padding: 20 }}>
        <Button title="Init Firebase" onPress={InitFirebaseApps} />
      </View>

      <NewAppScreen
        templateFileName="App.js" // Updated file name reference
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
