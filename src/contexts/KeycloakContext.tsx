/**
 * Keycloak Context Provider
 * 
 * This React Context provides Keycloak authentication state and functions
 * to all components in the application.
 * 
 * Architecture Pattern:
 * - KeycloakProvider wraps the entire app (in App.tsx)
 * - useKeycloak hook provides access to auth state in any component
 * - Centralized authentication state management
 * 
 * What This Provides:
 * - isAuthenticated: Whether user is logged in
 * - isLoading: Whether Keycloak is still initializing
 * - login/logout: Functions to authenticate/deauthenticate
 * - token: Current access token
 * - userInfo: User's profile information
 * 
 * @module contexts/KeycloakContext
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  initKeycloak, 
  login as keycloakLogin, 
  logout as keycloakLogout, 
  isAuthenticated, 
  getToken, 
  getUserInfo 
} from '../services/keycloak';

/**
 * Keycloak Context Type Definition
 * Defines the shape of data provided by the context
 */
interface KeycloakContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  token: string | undefined;
  userInfo: {
    username?: string;
    email?: string;
    name?: string;
    roles?: string[];
  } | null;
}

/**
 * Create the Context
 * Initially undefined, will be populated by KeycloakProvider
 */
const KeycloakContext = createContext<KeycloakContextType | undefined>(undefined);

/**
 * Keycloak Provider Component
 * 
 * This component initializes Keycloak when the app loads and provides
 * authentication state to all child components.
 * 
 * Lifecycle:
 * 1. Component mounts → useEffect runs
 * 2. Calls initKeycloak() to initialize connection
 * 3. Sets isLoading to true during initialization
 * 4. Once initialized, sets authentication state
 * 5. Provides state to all children via Context
 * 
 * @param {ReactNode} children - Child components that will have access to context
 */
export function KeycloakProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | undefined>();
  const [userInfo, setUserInfo] = useState<any>(null);

  /**
   * Initialize Keycloak on Component Mount
   * 
   * This useEffect runs once when the app first loads.
   * It initializes Keycloak and sets up the authentication state.
   * 
   * Empty dependency array [] means: run once on mount
   */
  useEffect(() => {
    const init = async () => {
      console.log('KeycloakProvider: Initializing...');
      try {
        const auth = await initKeycloak();
        console.log('KeycloakProvider: Initialization result:', auth);
        setAuthenticated(auth);
        
        if (auth) {
          const currentToken = getToken();
          const info = getUserInfo();
          console.log('KeycloakProvider: Setting token and user info');
          setToken(currentToken);
          setUserInfo(info);
        }
      } catch (error) {
        console.error('KeycloakProvider: Initialization error:', error);
      } finally {
        setIsLoading(false);
        console.log('KeycloakProvider: Loading complete');
      }
    };

    init();
  }, []); // Run once on mount

  /**
   * Login Handler
   * Redirects user to Keycloak login page
   */
  const login = () => {
    console.log('KeycloakProvider: Login requested');
    keycloakLogin();
  };

  /**
   * Logout Handler
   * Logs user out and clears local state
   */
  const logout = () => {
    console.log('KeycloakProvider: Logout requested');
    keycloakLogout();
    setAuthenticated(false);
    setToken(undefined);
    setUserInfo(null);
  };

  console.log('KeycloakProvider: Current state:', { authenticated, isLoading, hasToken: !!token });

  /**
   * Provide Context Value to Children
   * All child components can access these values via useKeycloak()
   */
  return (
    <KeycloakContext.Provider value={{ isAuthenticated: authenticated, isLoading, login, logout, token, userInfo }}>
      {children}
    </KeycloakContext.Provider>
  );
}

/**
 * Custom Hook to Use Keycloak Context
 * 
 * This hook provides easy access to Keycloak state in any component.
 * 
 * Usage Example:
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, login, logout, userInfo } = useKeycloak();
 *   
 *   if (!isAuthenticated) {
 *     return <button onClick={login}>Login</button>;
 *   }
 *   
 *   return <div>Welcome {userInfo?.name}!</div>;
 * }
 * ```
 * 
 * @returns {KeycloakContextType} Keycloak authentication state and functions
 * @throws {Error} If used outside of KeycloakProvider
 */
export function useKeycloak() {
  const context = useContext(KeycloakContext);
  if (context === undefined) {
    throw new Error('useKeycloak must be used within a KeycloakProvider');
  }
  return context;
}
