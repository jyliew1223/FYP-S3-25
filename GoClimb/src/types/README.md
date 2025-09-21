# Models

This folder contains data models and schemas for your app.

## Examples:
- `user.js` - User data models
- `api.js` - API response schemas
- `validation.js` - Data validation schemas

## Example:
```jsx
// models/user.js
export const createUser = (data) => ({
  id: data.id || null,
  email: data.email || '',
  name: data.name || '',
  avatar: data.avatar || null,
  createdAt: data.createdAt || new Date(),
  updatedAt: data.updatedAt || new Date(),
});

export const createUserProfile = (userData, profileData) => ({
  ...createUser(userData),
  bio: profileData.bio || '',
  location: profileData.location || '',
  website: profileData.website || '',
});

// models/api.js
export const createApiResponse = (success, data, message = null, error = null) => ({
  success,
  data,
  message,
  error,
});

export const createPaginatedResponse = (data, total, page, limit) => ({
  data,
  total,
  page,
  limit,
  hasMore: (page * limit) < total,
});

// models/validation.js
export const validateUser = (user) => {
  const errors = {};
  
  if (!user.email) errors.email = 'Email is required';
  if (!user.name) errors.name = 'Name is required';
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
```