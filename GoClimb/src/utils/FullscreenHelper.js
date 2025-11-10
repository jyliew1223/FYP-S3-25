import { StatusBar, Platform } from 'react-native';

export const enableFullscreen = () => {
  if (Platform.OS === 'android') {
    StatusBar.setHidden(true, 'fade');
    StatusBar.setBackgroundColor('transparent', true);
    StatusBar.setTranslucent(true);
  }
};

export const disableFullscreen = () => {
  if (Platform.OS === 'android') {
    StatusBar.setHidden(false, 'fade');
    StatusBar.setBackgroundColor('#000000', true);
    StatusBar.setTranslucent(false);
  }
};

// For navigation bar hiding, we need to add this to MainActivity.java
// or use a library like react-native-immersive
export const enableImmersiveMode = () => {
  // This would require native Android code or a third-party library
  // For now, we'll rely on the fullscreen modal and status bar hiding
  console.log('Immersive mode enabled (status bar hidden)');
};

export const disableImmersiveMode = () => {
  console.log('Immersive mode disabled (status bar restored)');
};