/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CatalogData } from '../types';
import { api } from '../lib/api';

interface CatalogContextType {
  catalog: CatalogData | null;
  isLoading: boolean;
  error: string | null;
  refreshCatalog: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

const CATALOG_CACHE_KEY = 'nexusedu_catalog_v1';
const CATALOG_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const clearCatalogCache = () => {
  try {
    localStorage.removeItem(CATALOG_CACHE_KEY);
  } catch (e) {
    console.warn('Failed to clear catalog cache', e);
  }
};

const loadFromCache = (): CatalogData | null => {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CATALOG_CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
};

const saveToCache = (data: CatalogData) => {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn('Failed to save catalog to cache', e);
  }
};

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = async (force = false) => {
    if (!force) {
      const cachedData = loadFromCache();
      if (cachedData) {
        setCatalog(cachedData);
        setIsLoading(false);
        // Still fetch in background to update cache
      }
    }

    try {
      const data = await fetchWithRetry();
      setCatalog(data);
      saveToCache(data);
      setError(null);
      
      // After catalog fetch succeeds, trigger backend warmup
      api.warmup();
    } catch (err: any) {
      if (!catalog) {
        setError(err.message || 'Failed to load catalog');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWithRetry = async (retries = 3, delayMs = 15000): Promise<CatalogData> => {
    for (let i = 0; i < retries; i++) {
      try {
        if (i > 0) {
          setError('সার্ভার চালু হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...');
        }
        const data = await api.getCatalogWithCache();
        return data;
      } catch (err) {
        if (i < retries - 1) {
          await new Promise(res => setTimeout(res, delayMs));
        } else {
          throw err;
        }
      }
    }
    throw new Error('Backend unavailable after retries');
  };

  useEffect(() => {
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshCatalog = async () => {
    try {
      setIsLoading(true);
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
