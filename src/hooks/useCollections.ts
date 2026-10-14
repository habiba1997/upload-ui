import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

interface Collection {
  id: string;
  name: string;
  metadata: {
    image_url?: string;
    URL?: string;
    [key: string]: any;
  };
  configuration_json?: any;
  dimension?: number | null;
  tenant?: string;
  database?: string;
  [key: string]: any;
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiRequest<{ collections: Collection[] }>('/collections');
      setCollections(data.collections || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch collections'));
    } finally {
      setIsLoading(false);
    }
  };

  return { collections, isLoading, error, refetch: fetchCollections };
}
