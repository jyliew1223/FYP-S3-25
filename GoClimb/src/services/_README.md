# Services

This folder contains API calls, external services, and utilities.

## Structure:
- `api/` - API related functions
- `storage/` - Local storage utilities
- `auth/` - Authentication services
- `notifications/` - Push notification services

## Example:
```jsx
// services/api/userApi.js
const API_BASE_URL = 'https://your-api.com';

export const userApi = {
  getProfile: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    return response.json();
  },
  
  updateProfile: async (userId, data) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
```