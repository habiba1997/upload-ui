import { createContext, useContext, ReactNode } from 'react';
import { useKeycloak } from './KeycloakContext';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
  userInfo: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, login, logout, isLoading, userInfo } = useKeycloak();


  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading, userInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
