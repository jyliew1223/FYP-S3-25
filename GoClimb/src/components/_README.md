# Components

This folder contains reusable UI components.

## Structure:
- `common/` - Generic reusable components (Button, Input, etc.)
- `ui/` - UI-specific components
- `forms/` - Form-related components

## Example:
```jsx
// components/common/Button.js
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export const Button = ({ title, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};
```