import { X } from 'lucide-react';

interface CollectionDetailModalProps {
  collection: any;
  onClose: () => void;
}

export function CollectionDetailModal({ collection, onClose }: CollectionDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">{collection.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Collection Details (JSON)</h3>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(collection, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

