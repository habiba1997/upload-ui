import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Loader2 } from 'lucide-react';

export function Login() {
  const { isAuthenticated, login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/app');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = () => {
    login();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Books Collections</h1>
          <p className="text-gray-600 mt-2">Sign in with Keycloak SSO</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="space-y-6">
            <div className="text-center text-sm text-gray-600">
              <p>You will be redirected to Keycloak</p>
              <p className="mt-1">for secure authentication</p>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Sign in with Keycloak
            </button>

            <div className="text-xs text-gray-500 text-center">
              <p>Keycloak Server: {import.meta.env.VITE_KEYCLOAK_URL}</p>
              <p>Realm: {import.meta.env.VITE_KEYCLOAK_REALM}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
