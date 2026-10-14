# Keycloak SSO Integration Guide

## Overview
This document outlines where and how to replace the temporary local authentication with Keycloak SSO.

## Files to Modify

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)

**Current Implementation:**
```typescript
const login = async (email: string, password: string) => {
  // TEMPORARY HARDCODED CREDENTIALS
  // Replace with Keycloak SSO later
  const VALID_EMAIL = 'habiba.ahmed@integrant.com';
  const VALID_PASSWORD = '1234';
  
  if (email === VALID_EMAIL && password === VALID_PASSWORD) {
    setIsAuthenticated(true);
  } else {
    throw new Error('Invalid credentials');
  }
};
```

**Steps to Replace:**

1. Install Keycloak adapter:
```bash
npm install keycloak-js
```

2. Initialize Keycloak in `AuthContext.tsx`:
```typescript
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://your-keycloak-server.com/auth',
  realm: 'your-realm',
  clientId: 'your-client-id',
});
```

3. Replace the `login` method:
```typescript
const login = async (email: string, password: string) => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: false,
    });
    
    if (authenticated) {
      setIsAuthenticated(true);
      // Store token for API calls
      localStorage.setItem('keycloak_token', keycloak.token);
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    throw new Error('Keycloak SSO error');
  }
};
```

4. Update the `logout` method:
```typescript
const logout = () => {
  keycloak.logout();
  setIsAuthenticated(false);
  localStorage.removeItem('keycloak_token');
};
```

5. Add token refresh logic:
```typescript
useEffect(() => {
  const refreshInterval = setInterval(() => {
    keycloak.updateToken(70).catch(() => {
      logout();
    });
  }, 60000); // Refresh every minute

  return () => clearInterval(refreshInterval);
}, []);
```

### 2. API Service (`src/services/api.ts`)

**Current Implementation:**
```typescript
const config: RequestInit = {
  ...options,
  headers: {
    'Content-Type': 'application/json',
    ...options.headers,
  },
};
```

**Steps to Add Authorization:**

1. Add function to get Keycloak token:
```typescript
function getAuthToken(): string | null {
  // Get token from Keycloak or localStorage
  return localStorage.getItem('keycloak_token');
}
```

2. Update headers to include Authorization:
```typescript
const config: RequestInit = {
  ...options,
  headers: {
    'Content-Type': 'application/json',
    // Add Authorization header for Keycloak SSO
    ...(getAuthToken() && { 'Authorization': `Bearer ${getAuthToken()}` }),
    ...options.headers,
  },
};
```

3. Handle 401 Unauthorized responses:
```typescript
if (response.status === 401) {
  // Token expired or invalid, redirect to login
  window.location.href = '/login';
  throw new Error('Unauthorized - please login again');
}
```

### 3. Upload Component (`src/components/UploadModal.tsx`)

**Current Implementation:**
```typescript
const response = await fetch('http://localhost:8085/api/upload/pdf', {
  method: 'POST',
  body: formData,
});
```

**Steps to Secure Upload:**

Add Authorization header to upload request:
```typescript
const token = localStorage.getItem('keycloak_token');

const response = await fetch('http://localhost:8085/api/upload/pdf', {
  method: 'POST',
  headers: {
    // Add Authorization header for Keycloak SSO
    ...(token && { 'Authorization': `Bearer ${token}` }),
  },
  body: formData,
});
```

## Configuration

### Environment Variables
Create a `.env` file with Keycloak configuration:

```env
VITE_KEYCLOAK_URL=https://your-keycloak-server.com/auth
VITE_KEYCLOAK_REALM=your-realm
VITE_KEYCLOAK_CLIENT_ID=your-client-id
```

Access in code:
```typescript
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});
```

## Testing

After integrating Keycloak:

1. Remove hardcoded credentials from `AuthContext.tsx`
2. Test login flow redirects to Keycloak
3. Verify tokens are included in API requests
4. Test token refresh mechanism
5. Verify logout clears session
6. Test token expiration handling

## Security Checklist

- [ ] Remove hardcoded credentials
- [ ] All API calls include Authorization header
- [ ] Token refresh is working
- [ ] Logout clears all tokens
- [ ] Handle 401 responses appropriately
- [ ] Use HTTPS in production
- [ ] Store tokens securely
- [ ] Implement proper CORS configuration

## Resources

- [Keycloak JavaScript Adapter Documentation](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)
- [Keycloak Admin Console](https://your-keycloak-server.com/auth/admin/)
- [React with Keycloak Guide](https://www.keycloak.org/getting-started/getting-started-react)

