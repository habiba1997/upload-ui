import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KeycloakProvider } from './contexts/KeycloakContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Login } from './pages/Login';
import { AppPage } from './pages/App';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  console.log('App: Rendering');
  return (
    <BrowserRouter>
      <KeycloakProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </KeycloakProvider>
    </BrowserRouter>
  );
}

export default App;
