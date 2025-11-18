// src/hooks/useSystemUI.js
import { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';

export const useSystemUI = (hideSystemUI = true) => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      if (hideSystemUI) {
        // Hide system UI (navigation bar and status bar)
        StatusBar.setHidden(true, 'slide');
        StatusBar.setBackgroundColor('transparent', true);
        StatusBar.setTranslucent(true);
        
        // For newer Android versions, we can use setSystemUIVisibility
        // This will hide the navigation bar but allow users to swipe to show it
        if (Platform.Version >= 19) {
          // Enable immersive mode - hides nav bar but user can swipe to show it
          const { NativeModules } = require('react-native');
          if (NativeModules.StatusBarManager) {
            NativeModules.StatusBarManager.setHidden(true);
          }
        }
      } else {
        // Show system UI
        StatusBar.setHidden(false, 'slide');
        StatusBar.setBackgroundColor('#000000', true);
        StatusBar.setTranslucent(false);
      }
    }

    // Cleanup function to restore system UI when component unmounts
    return () => {
      if (Platform.OS === 'android' && hideSystemUI) {
        StatusBar.setHidden(false, 'slide');
        StatusBar.setBackgroundColor('#000000', true);
        StatusBar.setTranslucent(false);
      }
    };
  }, [hideSystemUI]);

  const toggleSystemUI = () => {
    if (Platform.OS === 'android') {
      StatusBar.setHidden(!hideSystemUI, 'slide');
    }
  };

  return { toggleSystemUI };
};

export default useSystemUI;