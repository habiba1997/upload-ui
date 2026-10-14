/**
 * Keycloak Service
 * 
 * This service manages the Keycloak SSO (Single Sign-On) integration.
 * It handles authentication, token management, and user session lifecycle.
 * 
 * Key Responsibilities:
 * - Initialize Keycloak adapter with PKCE flow for security
 * - Handle login/logout operations
 * - Manage access tokens and automatic token refresh
 * - Provide user information from JWT tokens
 * 
 * @module services/keycloak
 */

import Keycloak from 'keycloak-js';

/**
 * Keycloak Configuration
 * These values come from environment variables (.env file)
 * 
 * IMPORTANT: Never hardcode these values or include secrets in frontend code
 * 
 * @property {string} url - Keycloak server URL (e.g., http://localhost:8281)
 * @property {string} realm - Keycloak realm name (e.g., aicdp)
 * @property {string} clientId - Keycloak client ID (e.g., uplaod-pdf-app)
 */
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};

/**
 * Keycloak Instance
 * This is the main Keycloak adapter instance that manages the SSO connection
 * It's a singleton that's shared across the application
 */
const keycloak = new Keycloak(keycloakConfig);

/**
 * Initialize Keycloak
 * 
 * This function initializes the Keycloak adapter and checks if the user
 * already has a valid session. It's called when the app first loads.
 * 
 * Authentication Flow:
 * 1. Initialize Keycloak with configuration
 * 2. Check if user has existing session (check-sso)
 * 3. If authenticated, extract and log token information
 * 4. Set up automatic token refresh before expiration
 * 
 * Configuration Options Explained:
 * - onLoad: 'check-sso' 
 *   Checks for existing session without forcing login redirect
 *   If no session exists, user stays on current page
 * 
 * - checkLoginIframe: false 
 *   Disables iframe checking for better performance and security
 *   Iframe checking can cause issues with some browsers
 * 
 * - pkceMethod: 'S256' 
 *   Uses PKCE (Proof Key for Code Exchange) with SHA-256
 *   PKCE prevents authorization code interception attacks
 *   Required for public clients (browser apps) for security
 * 
 * @returns {Promise<boolean>} true if user is authenticated, false otherwise
 */
export const initKeycloak = async () => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
      pkceMethod: 'S256',
    });

    console.log('Keycloak initialized. Authenticated:', authenticated);

    /**
     * Token Expiration Handler
     * 
     * This callback is triggered when the access token expires.
     * It automatically attempts to refresh the token using the refresh token.
     * 
     * Token Refresh Process:
     * 1. Access token expires (typically after 5-15 minutes depending on Keycloak config)
     * 2. This handler is called automatically
     * 3. Uses refresh token to request a new access token from Keycloak
     * 4. If refresh succeeds, user continues seamlessly without re-login
     * 5. If refresh fails (refresh token expired), user is logged out
     * 
     * updateToken(70) means: 
     * Refresh the token if it expires in less than 70 seconds
     * This provides a 70-second buffer before actual expiration
     */
    keycloak.onTokenExpired = () => {
      console.log('Token expired. Refreshing...');
      keycloak
        .updateToken(70)
        .then((refreshed) => {
          if (refreshed) {
            console.log('New Access Token:', keycloak.token);
          } else {
            console.log('Token is still valid');
          }
        })
        .catch(() => {
          console.error('Failed to refresh token. Logging out...');
          keycloak.logout();
        });
    };

    return authenticated;
  } catch (error) {
    console.error('Keycloak initialization failed:', error);
    return false;
  }
};

/**
 * Login Function
 * 
 * Redirects the user to Keycloak's login page for authentication.
 * 
 * Login Flow (OAuth 2.0 Authorization Code Flow with PKCE):
 * 1. User clicks "Sign in with Keycloak"
 * 2. This function redirects to Keycloak server's auth endpoint
 * 3. User enters credentials on Keycloak's secure page
 * 4. Keycloak validates credentials
 * 5. Keycloak redirects back with authorization code in URL
 * 6. Keycloak JS adapter automatically exchanges code for tokens
 * 7. User is now authenticated with access token
 * 
 * Security Note:
 * - User never enters credentials in your app (more secure)
 * - Credentials are only handled by Keycloak server
 * - PKCE prevents code interception attacks
 */
export const login = () => {
  console.log('Redirecting to Keycloak login...');
  keycloak.login();
};

/**
 * Logout Function
 * 
 * Logs the user out from Keycloak and clears all tokens.
 * After logout, user is redirected to the application's home page.
 * 
 * Logout Process:
 * 1. Clears local tokens (access, refresh, ID tokens)
 * 2. Calls Keycloak server to invalidate the session
 * 3. Redirects user to specified URL (or application origin)
 * 
 * @param {Object} options - Logout options
 * @param {string} options.redirectUri - URL to redirect after logout
 */
export const logout = () => {
  console.log('Logging out from Keycloak...');
  keycloak.logout({ redirectUri: window.location.origin });
};

/**
 * Get Access Token
 * 
 * Returns the current JWT access token.
 * This token is used in Authorization headers for API requests.
 * 
 * JWT Token Structure:
 * - Header: Contains algorithm (RS256) and token type (JWT)
 * - Payload: Contains user info, roles, expiration, issuer
 * - Signature: Cryptographic signature for verification
 * 
 * Usage Example:
 * const token = getToken();
 * fetch('/api/data', {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * 
 * @returns {string | undefined} The access token or undefined if not authenticated
 */
export const getToken = () => {
  return keycloak.token;
};

/**
 * Check Authentication Status
 * 
 * Returns whether the user is currently authenticated.
 * This checks if a valid access token exists.
 * 
 * @returns {boolean} true if user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const authenticated = keycloak.authenticated || false;
  console.log('Is authenticated:', authenticated);
  return authenticated;
};

/**
 * Update Token Manually
 * 
 * Manually triggers a token refresh if the token is about to expire.
 * This is usually called automatically by onTokenExpired, but can be
 * called manually if needed (e.g., before making important API calls).
 * 
 * @param {number} minValidity - Minimum token validity in seconds (default: 70)
 *                               If token expires in less than this, it will refresh
 * @returns {Promise<boolean>} true if token was refreshed, false if still valid
 */
export const updateToken = () => {
  return keycloak.updateToken(70);
};

/**
 * Get User Information
 * 
 * Extracts user information from the parsed JWT access token.
 * The token contains claims (user data) that are decoded automatically.
 * 
 * JWT Token Claims (Standard):
 * - preferred_username: Username in Keycloak
 * - email: User's email address
 * - name: User's full name
 * - sub: Subject (unique user ID)
 * - realm_access.roles: Array of user roles from the realm
 * - resource_access: Client-specific roles
 * - exp: Token expiration timestamp
 * - iat: Token issued at timestamp
 * 
 * @returns {Object} User information object containing username, email, name, and roles
 */
export const getUserInfo = () => {
  const userInfo = {
    username: keycloak.tokenParsed?.preferred_username,
    email: keycloak.tokenParsed?.email,
    name: keycloak.tokenParsed?.name,
    roles: keycloak.realmAccess?.roles || [],
  };
  console.log('User Info:', userInfo);
  return userInfo;
};

/**
 * Export Keycloak Instance
 * 
 * Exports the raw Keycloak instance for advanced use cases.
 * Most components should use the wrapper functions above instead.
 */
export default keycloak;
