# Keycloak SSO Integration Guide for React/Next.js Applications

**Author:** Principal Engineer  
**Purpose:** Step-by-step guide to integrate Keycloak SSO into any React or Next.js application  
**Audience:** Java engineers new to React/JavaScript ecosystem

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Install Dependencies](#step-1-install-dependencies)
4. [Step 2: Environment Configuration](#step-2-environment-configuration)
5. [Step 3: Create Keycloak Service](#step-3-create-keycloak-service)
6. [Step 4: Create Keycloak Context](#step-4-create-keycloak-context)
7. [Step 5: Integrate into Application](#step-5-integrate-into-application)
8. [Step 6: Update API Service](#step-6-update-api-service)
9. [Step 7: Update Components](#step-7-update-components)
10. [Step 8: Keycloak Server Configuration](#step-8-keycloak-server-configuration)
11. [Testing & Verification](#testing--verification)
12. [Comparison: React vs Spring Boot](#comparison-react-vs-spring-boot)

---

## Overview

### What is Keycloak SSO?

Keycloak is an open-source Identity and Access Management (IAM) solution. It provides:
- **Single Sign-On (SSO)**: One login for multiple applications
- **OAuth 2.0 / OpenID Connect**: Industry-standard authentication protocols
- **JWT Tokens**: Secure, stateless authentication
- **Role-Based Access Control (RBAC)**: Manage user permissions

### Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│                 │       │                  │       │                 │
│  React/Next.js  │◄─────►│    Keycloak      │       │  Spring Boot    │
│  Frontend       │       │    Server        │       │  Backend        │
│  (Port 3000)    │       │  (Port 8281)     │       │  (Port 8005)    │
│                 │       │                  │       │                 │
└─────────────────┘       └──────────────────┘       └─────────────────┘
        │                          │                          ▲
        │  1. Login Request        │                          │
        ├─────────────────────────►│                          │
        │                          │                          │
        │  2. Auth Code            │                          │
        │◄─────────────────────────┤                          │
        │                          │                          │
        │  3. Exchange for Tokens  │                          │
        ├─────────────────────────►│                          │
        │                          │                          │
        │  4. Access Token         │                          │
        │◄─────────────────────────┤                          │
        │                                                     │
        │  5. API Call with Bearer Token                     │
        └────────────────────────────────────────────────────┘
```

### Key Concepts for Java Engineers

| Concept | React/JS | Spring Boot | Description |
|---------|----------|-------------|-------------|
| **Service Layer** | `services/keycloak.ts` | `@Service` class | Handles business logic |
| **Context/Provider** | React Context | `@Autowired` beans | Dependency injection |
| **Environment Variables** | `.env` with `VITE_*` | `application.properties` | Configuration |
| **Token Storage** | Memory (in-app state) | Session/SecurityContext | User session |
| **API Interceptor** | Fetch wrapper | `@RestTemplate` interceptor | Add headers to requests |

---

## Prerequisites

### Required Software
- Node.js v16+ (like JDK for Java)
- npm or yarn (like Maven/Gradle)
- Keycloak server running
- Your React/Next.js application

### Required Knowledge
- Basic React concepts (components, hooks, context)
- Understanding of OAuth 2.0 / OIDC flow
- JWT token structure

---

## Step 1: Install Dependencies

### For React (Vite/Create React App)

```bash
npm install keycloak-js
```

### For Next.js

```bash
npm install next-auth
npm install keycloak-js
```

**Note:** This guide focuses on React with `keycloak-js`. For Next.js, use `next-auth` with Keycloak provider.

---

## Step 2: Environment Configuration

Create a `.env` file in your project root:

```env
# Keycloak Server Configuration
VITE_KEYCLOAK_URL=http://localhost:8281
VITE_KEYCLOAK_REALM=your-realm-name
VITE_KEYCLOAK_CLIENT_ID=your-client-id

# Backend API URL
VITE_BACKEND_URL=http://localhost:8005
```

**Important Notes:**
- `VITE_*` prefix is required for Vite projects
- For Create React App, use `REACT_APP_*` prefix
- For Next.js, use `NEXT_PUBLIC_*` prefix
- Never commit `.env` to git (add to `.gitignore`)

### Environment Variable Access

```typescript
// React/Vite
const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;

// Create React App
const keycloakUrl = process.env.REACT_APP_KEYCLOAK_URL;

// Next.js
const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
```

---

## Step 3: Create Keycloak Service

Create `src/services/keycloak.ts`:

```typescript
/**
 * Keycloak Service
 * Similar to @Service class in Spring Boot
 * Handles all Keycloak operations
 */
import Keycloak from 'keycloak-js';

// Configuration (like @Value in Spring)
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};

// Singleton instance (like Spring Bean)
const keycloak = new Keycloak(keycloakConfig);

/**
 * Initialize Keycloak
 * Called once when app starts (like @PostConstruct)
 */
export const initKeycloak = async (): Promise<boolean> => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',        // Check for existing session
      checkLoginIframe: false,     // Disable iframe (better performance)
      pkceMethod: 'S256',          // Use PKCE for security
    });

    // Set up automatic token refresh (like Spring Security)
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(70).catch(() => {
        keycloak.logout();
      });
    };

    return authenticated;
  } catch (error) {
    console.error('Keycloak init failed:', error);
    return false;
  }
};

/**
 * Login - Redirects to Keycloak
 * Similar to redirecting to login page in Spring Security
 */
export const login = (): void => {
  keycloak.login();
};

/**
 * Logout - Clears session
 */
export const logout = (): void => {
  keycloak.logout({ redirectUri: window.location.origin });
};

/**
 * Get Access Token
 * Similar to SecurityContextHolder.getContext().getAuthentication()
 */
export const getToken = (): string | undefined => {
  return keycloak.token;
};

/**
 * Check Authentication Status
 */
export const isAuthenticated = (): boolean => {
  return keycloak.authenticated || false;
};

/**
 * Get User Info from Token
 * Similar to @AuthenticationPrincipal in Spring
 */
export const getUserInfo = () => {
  return {
    username: keycloak.tokenParsed?.preferred_username,
    email: keycloak.tokenParsed?.email,
    name: keycloak.tokenParsed?.name,
    roles: keycloak.realmAccess?.roles || [],
  };
};

export default keycloak;
```

---

## Step 4: Create Keycloak Context

Create `src/contexts/KeycloakContext.tsx`:

```typescript
/**
 * Keycloak Context Provider
 * Similar to @Component that provides beans in Spring
 * Makes authentication state available to all components
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initKeycloak, login, logout, getToken, getUserInfo } from '../services/keycloak';

interface KeycloakContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  token: string | undefined;
  userInfo: any;
}

const KeycloakContext = createContext<KeycloakContextType | undefined>(undefined);

/**
 * Provider Component
 * Wrap your app with this (like @Configuration)
 */
export function KeycloakProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | undefined>();
  const [userInfo, setUserInfo] = useState<any>(null);

  // Initialize on mount (like @PostConstruct)
  useEffect(() => {
    const init = async () => {
      const auth = await initKeycloak();
      setAuthenticated(auth);
      
      if (auth) {
        setToken(getToken());
        setUserInfo(getUserInfo());
      }
      
      setIsLoading(false);
    };

    init();
  }, []);

  const handleLogin = () => login();
  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setToken(undefined);
    setUserInfo(null);
  };

  return (
    <KeycloakContext.Provider 
      value={{ isAuthenticated: authenticated, isLoading, login: handleLogin, logout: handleLogout, token, userInfo }}
    >
      {children}
    </KeycloakContext.Provider>
  );
}

/**
 * Custom Hook to access Keycloak
 * Similar to @Autowired in Spring
 */
export function useKeycloak() {
  const context = useContext(KeycloakContext);
  if (!context) {
    throw new Error('useKeycloak must be used within KeycloakProvider');
  }
  return context;
}
```

---

## Step 5: Integrate into Application

### Update `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { KeycloakProvider } from './contexts/KeycloakContext';

function App() {
  return (
    <BrowserRouter>
      {/* Wrap entire app with KeycloakProvider */}
      <KeycloakProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </KeycloakProvider>
    </BrowserRouter>
  );
}
```

### Create Protected Route Component:

```typescript
/**
 * Protected Route
 * Similar to @PreAuthorize in Spring Security
 */
import { Navigate } from 'react-router-dom';
import { useKeycloak } from '../contexts/KeycloakContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useKeycloak();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

## Step 6: Update API Service

Create `src/services/api.ts`:

```typescript
/**
 * API Service with Token Injection
 * Similar to RestTemplate with interceptor in Spring
 */
import { getToken } from './keycloak';

const API_BASE_URL = '/api/v1';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  // Add Authorization header (like Spring Security filter)
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// Usage Example:
// const data = await apiRequest<User[]>('/users');
```

---

## Step 7: Update Components

### Login Page:

```typescript
import { useKeycloak } from '../contexts/KeycloakContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function LoginPage() {
  const { isAuthenticated, login, isLoading } = useKeycloak();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return <div>Initializing...</div>;
  }

  return (
    <div>
      <h1>Login</h1>
      <button onClick={login}>
        Sign in with Keycloak
      </button>
    </div>
  );
}
```

### Dashboard with User Info:

```typescript
import { useKeycloak } from '../contexts/KeycloakContext';

export function Dashboard() {
  const { userInfo, logout } = useKeycloak();

  return (
    <div>
      <h1>Welcome, {userInfo?.name}!</h1>
      <p>Email: {userInfo?.email}</p>
      <p>Roles: {userInfo?.roles.join(', ')}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## Step 8: Keycloak Server Configuration

### In Keycloak Admin Console:

1. **Create/Configure Client**
   - Navigate to: Clients → Create
   - Client ID: `your-app-client`
   - Client Protocol: `openid-connect`
   - Click Save

2. **Settings Tab**
   - **Access Type**: `public` (for browser apps)
   - **Standard Flow**: Enabled ✅
   - **Direct Access Grants**: Enabled ✅
   - **Valid Redirect URIs**: `http://localhost:3000/*`
   - **Web Origins**: `http://localhost:3000`
   - **Save**

3. **Advanced Settings**
   - **Proof Key for Code Exchange Code Challenge Method**: `S256`
   - **Save**

### Why Public Client?

```
┌─────────────────────────────────────────────────────┐
│ Client Type Comparison                               │
├─────────────────────────────────────────────────────┤
│ Confidential Client:                                │
│ - Has client secret                                 │
│ - Used in server-side apps (Spring Boot)           │
│ - Secret never exposed to users                     │
│                                                      │
│ Public Client:                                      │
│ - NO client secret                                  │
│ - Used in browser apps (React/Next.js)             │
│ - Uses PKCE for security instead                   │
│ - Secret would be visible in browser = insecure    │
└─────────────────────────────────────────────────────┘
```

---

## Testing & Verification

### 1. Check Keycloak Connection

```bash
curl http://localhost:8281/realms/your-realm
```

Should return realm configuration JSON.

### 2. Test Authentication Flow

1. Open browser: `http://localhost:3000`
2. Open DevTools → Console
3. Click "Sign in with Keycloak"
4. Check console logs:
   - "Keycloak initialized"
   - "Authenticated: true"
   - "Access Token: ey..."

### 3. Test API Calls

1. Open DevTools → Network tab
2. Make an API call
3. Click on the request
4. Check Headers → Request Headers
5. Verify: `Authorization: Bearer <token>` is present

### 4. Test Token Refresh

1. Wait for token to expire (or manually expire it in Keycloak)
2. Make another API call
3. Check console for "Token expired. Refreshing..."
4. Verify new token is received

---

## Comparison: React vs Spring Boot

### Token Handling

#### Spring Boot
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http.oauth2ResourceServer(oauth2 -> oauth2.jwt());
        return http.build();
    }
}

@RestController
public class UserController {
    @GetMapping("/profile")
    public UserProfile getProfile(@AuthenticationPrincipal Jwt jwt) {
        return new UserProfile(jwt.getClaimAsString("email"));
    }
}
```

#### React
```typescript
const { userInfo } = useKeycloak();
const email = userInfo?.email;

// For API calls
const token = getToken();
fetch('/api/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Dependency Injection

#### Spring Boot
```java
@Autowired
private KeycloakService keycloakService;
```

#### React
```typescript
const { isAuthenticated, login } = useKeycloak();
```

### Configuration

#### Spring Boot (`application.properties`)
```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8281/realms/my-realm
```

#### React (`.env`)
```env
VITE_KEYCLOAK_URL=http://localhost:8281
VITE_KEYCLOAK_REALM=my-realm
```

---

## Common Patterns

### Pattern 1: Role-Based Access

```typescript
// Check if user has specific role
function hasRole(role: string): boolean {
  const { userInfo } = useKeycloak();
  return userInfo?.roles?.includes(role) || false;
}

// Usage in component
export function AdminPanel() {
  if (!hasRole('ADMIN')) {
    return <div>Access Denied</div>;
  }
  
  return <div>Admin Content</div>;
}
```

### Pattern 2: Automatic Token Refresh

```typescript
// Already handled by keycloak.onTokenExpired
// But you can manually refresh before API calls:

async function makeImportantAPICall() {
  await updateToken(); // Refresh if needed
  const token = getToken();
  // Make API call with fresh token
}
```

### Pattern 3: Multiple Backend Services

```typescript
// Service A
await fetch('http://backend-a:8005/api/data', {
  headers: { 'Authorization': `Bearer ${getToken()}` }
});

// Service B
await fetch('http://backend-b:8006/api/data', {
  headers: { 'Authorization': `Bearer ${getToken()}` }
});

// Same token works for all services in the same realm!
```

---

## Troubleshooting

### Issue: 401 Unauthorized

**Cause:** Token not being sent or invalid

**Solution:**
```typescript
// Check if token exists
const token = getToken();
console.log('Token:', token);

// Check API request
console.log('Headers:', headers);
```

### Issue: CORS Errors

**Cause:** Browser blocking requests

**Solution in Vite:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8005',
        changeOrigin: true,
      }
    }
  }
});
```

### Issue: Redirect Loop

**Cause:** App keeps redirecting to login

**Solution:**
Check Keycloak client configuration:
- Valid Redirect URIs must include your app URL
- Use `check-sso` instead of `login-required`

---

## Security Best Practices

1. **Never log tokens in production**
   ```typescript
   if (process.env.NODE_ENV !== 'production') {
     console.log('Token:', token);
   }
   ```

2. **Always use HTTPS in production**
   ```typescript
   if (process.env.NODE_ENV === 'production' && !window.location.protocol.includes('https')) {
     window.location.protocol = 'https:';
   }
   ```

3. **Set short token expiration** (in Keycloak)
   - Access Token: 5-15 minutes
   - Refresh Token: 30 minutes

4. **Use PKCE** (already configured)
   - Prevents authorization code interception

5. **Validate tokens on backend** (Spring Boot)
   ```java
   spring.security.oauth2.resourceserver.jwt.jwk-set-uri=
     http://localhost:8281/realms/my-realm/protocol/openid-connect/certs
   ```

---

## Summary Checklist

- [ ] Install `keycloak-js` package
- [ ] Create `.env` with Keycloak configuration
- [ ] Create `services/keycloak.ts` service
- [ ] Create `contexts/KeycloakContext.tsx` provider
- [ ] Wrap app with `KeycloakProvider` in `App.tsx`
- [ ] Update API service to include `Authorization` header
- [ ] Create login page with Keycloak button
- [ ] Create protected routes
- [ ] Configure Keycloak client as **public**
- [ ] Set valid redirect URIs in Keycloak
- [ ] Enable PKCE (S256) in Keycloak
- [ ] Test login/logout flow
- [ ] Test token in API calls
- [ ] Test token refresh

---

## Next Steps

1. **Configure Spring Boot backend** to validate JWT tokens
2. **Implement role-based access** in frontend and backend
3. **Add refresh token rotation** for better security
4. **Set up production environment** with HTTPS
5. **Monitor token expiration** and refresh patterns

---

**Questions or Issues?**
Check the console logs - all Keycloak operations are logged for debugging.

**For Java Engineers:**
Think of Keycloak Context as Spring's `@Autowired` beans, and the service layer as `@Service` classes. The concepts are similar, just different syntax!



