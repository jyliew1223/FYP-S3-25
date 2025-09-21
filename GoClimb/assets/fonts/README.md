# Fonts

This folder contains custom font files for your app.

## Supported formats:
- `.ttf` (TrueType Font)
- `.otf` (OpenType Font)

## Organization:
```
fonts/
├── Roboto-Regular.ttf
├── Roboto-Bold.ttf
├── Roboto-Light.ttf
└── CustomFont-Regular.ttf
```

## Usage:
1. Add font files to this folder
2. Link fonts in your app (auto-linking should handle this)
3. Use in your styles:

```jsx
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
  },
});
```

## Note:
- Font names in code should match the font's internal name, not the filename
- Test fonts on both iOS and Android as they may render differently