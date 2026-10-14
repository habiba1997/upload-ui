# Keycloak Authentication Integration

This application now uses Keycloak for authentication. Below is a detailed explanation of how it works.

## Architecture Overview

```
┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
│              │      │              │      │                  │
│  React App   │◄────►│   Keycloak   │      │  Spring Boot API │
│ (Port 3000)  │      │ (Port 8281)  │      │  (Port 8005)     │
│              │      │              │      │                  │
└──────────────┘      └──────────────┘      └──────────────────┘
       │                      │                      ▲
       │                      │                      │
       │  1. Login Request    │                      │
       ├─────────────────────►│                      │
       │                      │                      │
       │  2. Auth Code        │                      │
       │◄─────────────────────┤                      │
       │                      │                      │
       │  3. Exchange for     │                      │
       │     Access Token     │                      │
       ├─────────────────────►│                      │
       │                      │                      │
       │  4. Access Token     │                      │
       │◄─────────────────────┤                      │
       │                                              │
       │  5. API Call with Bearer Token              │
       └─────────────────────────────────────────────┘
```

## Authentication Flow

### Step 1: User Visits App
- User opens `http://localhost:3000`
- App initializes Keycloak with `check-sso` mode
- If no valid session, shows login page

### Step 2: Login Process
1. **User clicks "Sign in with Keycloak"**
   - Calls `keycloak.login()`
   - Redirects to: `http://localhost:8281/realms/my-app-realm/protocol/openid-connect/auth`

2. **User enters credentials on Keycloak page**
   - Keycloak validates username/password
   - On success, redirects back with authorization code

3. **Keycloak redirects to app**
   - Returns to: `http://localhost:3000?code=abc123...`
   - Keycloak adapter automatically exchanges code for tokens

4. **Tokens received**
   - Access Token (JWT)
   - Refresh Token
   - ID Token

### Step 3: Making API Calls
Every API request includes the access token:

```javascript
// Automatically added by api.ts
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

### Step 4: Token Refresh
- Access tokens expire after a set time
- Keycloak adapter automatically refreshes tokens before expiry
- If refresh fails, user is redirected to login

## Configuration

### Environment Variables (.env)
```bash
VITE_KEYCLOAK_URL=http://localhost:8281
VITE_KEYCLOAK_REALM=my-app-realm
VITE_KEYCLOAK_CLIENT_ID=nextjs-client
VITE_BACKEND_URL=http://localhost:8005
```

### Keycloak Configuration
Your Keycloak client should be configured with:

**Client ID:** `nextjs-client`

**Valid Redirect URIs:**
- `http://localhost:3000/*`

**Web Origins:**
- `http://localhost:3000`

**Access Type:** `public` (for JavaScript apps)

**Direct Access Grants:** Enabled (optional)

**Standard Flow:** Enabled

## Key Files

### 1. `src/services/keycloak.ts`
- Initializes Keycloak instance
- Handles login/logout
- Manages token refresh
- Provides token access functions

### 2. `src/contexts/KeycloakContext.tsx`
- React context for Keycloak state
- Provides authentication status
- Manages loading states

### 3. `src/contexts/AuthContext.tsx`
- Wrapper around KeycloakContext
- Maintains backward compatibility with existing code

### 4. `src/services/api.ts`
- Automatically adds Authorization header
- Includes token from Keycloak
- Logs all requests/responses

### 5. `src/components/UploadModal.tsx`
- Includes token in file upload requests
- Logs upload process

## Console Logging

The application logs all authentication and API activities to the browser console:

### Keycloak Initialization
```javascript
console.log('Keycloak Configuration:', {...})
console.log('Initializing Keycloak...')
console.log('Keycloak initialized. Authenticated:', true/false)
console.log('Access Token:', token)
console.log('User Roles:', roles)
```

### API Requests
```javascript
console.log('API Request:', { url, method, hasToken })
console.log('API Request headers:', {...})
console.log('API Response:', { url, status, statusText })
console.log('API Response data:', {...})
```

### Upload Requests
```javascript
console.log('Upload: Uploading file:', filename, 'hasToken:', true/false)
console.log('Upload: Response status:', status)
console.log('Upload: Success response:', {...})
```

## Token Structure

### Access Token (JWT)
The access token contains user information and roles:

```json
{
  "exp": 1701234567,
  "iat": 1701230967,
  "iss": "http://localhost:8281/realms/my-app-realm",
  "sub": "user-uuid",
  "preferred_username": "john.doe",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "realm_access": {
    "roles": ["user", "admin"]
  }
}
```

### Backend Validation
Your Spring Boot backend should:
1. Validate the JWT signature
2. Check token expiration
3. Verify issuer matches your Keycloak realm
4. Extract user information from token claims

## Testing the Integration

### 1. Check Keycloak is Running
```bash
curl http://localhost:8281/realms/my-app-realm
```
Should return realm configuration

### 2. Start the Frontend
```bash
npm run dev
```

### 3. Open Browser Console
- Open DevTools (F12)
- Go to Console tab
- Watch for Keycloak initialization logs

### 4. Test Login Flow
1. Click "Sign in with Keycloak"
2. Watch console for redirect logs
3. Enter credentials on Keycloak page
4. After redirect, check console for token logs

### 5. Test API Calls
1. After login, navigate to collections page
2. Watch console for API request logs
3. Check that Authorization header is present

### 6. Test Token in Network Tab
1. Open Network tab in DevTools
2. Make an API call
3. Click on the request
4. Check Headers → Request Headers
5. Verify `Authorization: Bearer <token>` is present

## Troubleshooting

### "Failed to initialize Keycloak"
- Check Keycloak is running on port 8281
- Verify realm name is correct
- Check client ID exists

### "CORS Error"
- Add `http://localhost:3000` to Keycloak client's Web Origins
- Check Valid Redirect URIs includes `http://localhost:3000/*`

### "401 Unauthorized from API"
- Check token is being sent (console logs)
- Verify Spring Boot is validating with correct Keycloak issuer
- Check token hasn't expired

### "Token not refreshing"
- Check console for token refresh logs
- Verify refresh token was received
- Check token refresh interval (default: 70 seconds before expiry)

## Security Notes

1. **Access tokens** are stored in memory only (not localStorage)
2. **Tokens expire** - default is usually 5-15 minutes
3. **Refresh tokens** allow getting new access tokens without re-login
4. **Always use HTTPS** in production
5. **Never log tokens** in production (remove console.log statements)

## Production Deployment

Before deploying to production:

1. **Remove console.log statements** from:
   - `src/services/keycloak.ts`
   - `src/contexts/KeycloakContext.tsx`
   - `src/services/api.ts`
   - `src/components/UploadModal.tsx`

2. **Update environment variables** to production URLs

3. **Update Keycloak client configuration** with production redirect URIs

4. **Enable HTTPS** for all services

5. **Set secure cookie flags** if using session storage

## Next Steps

Your Spring Boot backend should:
1. Configure Spring Security with Keycloak
2. Add JWT validation
3. Extract user info from token
4. Implement role-based access control

See your backend documentation for Spring Boot + Keycloak integration.

