// src/utils/SystemUIManager.js
import { Platform, StatusBar, NativeModules } from 'react-native';

const { SystemUIModule } = NativeModules;

const SystemUIManager = {
  isHidden: false,

  hideSystemUI() {
    if (Platform.OS !== 'android') return;

    try {
      // Hide status bar
      StatusBar.setHidden(true, 'slide');
      StatusBar.setBackgroundColor('transparent', true);
      StatusBar.setTranslucent(true);

      // Use our custom native module for better control
      if (SystemUIModule) {
        SystemUIModule.hideSystemUI();
      }

      this.isHidden = true;
    } catch (error) {
      console.log('SystemUIManager: Error hiding system UI:', error);
    }
  },

  showSystemUI() {
    if (Platform.OS !== 'android') return;

    try {
      // Show status bar
      StatusBar.setHidden(false, 'slide');
      StatusBar.setBackgroundColor('#000000', true);
      StatusBar.setTranslucent(false);

      // Use our custom native module
      if (SystemUIModule) {
        SystemUIModule.showSystemUI();
      }

      this.isHidden = false;
    } catch (error) {
      console.log('SystemUIManager: Error showing system UI:', error);
    }
  },

  toggleSystemUI() {
    if (this.isHidden) {
      this.showSystemUI();
    } else {
      this.hideSystemUI();
    }
  },

  setImmersiveMode(enable = true) {
    if (Platform.OS !== 'android') return;

    if (enable) {
      this.hideSystemUI();
    } else {
      this.showSystemUI();
    }
  }
};

export default SystemUIManager;