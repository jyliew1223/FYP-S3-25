# Hooks

This folder contains custom React hooks.

## Examples:
- `useAuth.js` - Authentication hook
- `useApi.js` - API calling hook
- `useStorage.js` - Local storage hook

## Example:
```jsx
// hooks/useAuth.js
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    // Login logic
  };

  const logout = () => {
    setUser(null);
  };

  return { user, loading, login, logout };
};
```