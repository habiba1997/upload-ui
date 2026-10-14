import { useState } from 'react';
import { LogOut, Upload, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '../hooks/useCollections';
import { BookCard } from '../components/BookCard';
import { UploadModal } from '../components/UploadModal';
import { CollectionDetailModal } from '../components/CollectionDetailModal';

export function AppPage() {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { collections, isLoading, error, refetch } = useCollections();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUploadSuccess = (message: string) => {
    showToast(message || 'PDF uploaded successfully!', 'success');
    refetch();
  };

  const handleUploadError = (errorMessage: string) => {
    showToast(errorMessage, 'error');
  };

  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Books Collections</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700">Your Collections</h2>
          <p className="text-sm text-gray-500 mt-1">Browse and manage your book collections</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading collections...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load collections</h3>
            <p className="text-sm text-red-700 mb-4">{error.message}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && collections.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No collections yet</h3>
            <p className="text-gray-500 mb-4">Upload your first PDF to get started!</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload PDF
            </button>
          </div>
        )}

        {!isLoading && !error && collections.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collections.map((collection) => (
              <div key={collection.id} onClick={() => setSelectedCollection(collection)}>
                <BookCard
                  name={collection.name}
                  imageUrl={collection.metadata?.image_url || collection.metadata?.URL}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      )}

      {selectedCollection && (
        <CollectionDetailModal
          collection={selectedCollection}
          onClose={() => setSelectedCollection(null)}
        />
      )}
    </div>
  );
}
