module.exports = {
  preset: 'react-native',
  setupFiles: [
    '<rootDir>/__mocks__/@react-native-firebase/app.js',
    '<rootDir>/__mocks__/@react-native-firebase/app-check.js',
    '<rootDir>/__mocks__/@react-native-firebase/auth.js',
    '<rootDir>/__mocks__/@react-native-firebase/async-storage.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation)',
  ],
};
