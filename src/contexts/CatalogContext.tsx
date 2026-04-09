/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { CatalogData } from '../types';
import { api } from '../lib/api';

interface CatalogContextType {
  catalog: CatalogData | null;
  isLoading: boolean;
  error: string | null;
  refreshCatalog: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);

  const fetchCatalog = async (force = false) => {
    const now = Date.now();
    // 5 minutes TTL
    if (!force && catalog && now - lastFetchTime.current < 5 * 60 * 1000) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getCatalogWithCache();
      setCatalog(data);
      lastFetchTime.current = Date.now();
      
      // After catalog fetch succeeds, trigger backend warmup
      api.warmup();
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshCatalog = async () => {
    try {
      await api.refreshCatalog();
      await fetchCatalog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh catalog');
      throw err;
    }
  };

  return (
    <CatalogContext.Provider value={{ catalog, isLoading, error, refreshCatalog }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
