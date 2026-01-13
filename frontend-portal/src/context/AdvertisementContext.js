import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import api from '../utils/api';

const AdvertisementContext = createContext();

export const useAdvertisement = () => {
  const context = useContext(AdvertisementContext);
  if (!context) {
    throw new Error('useAdvertisement must be used within AdvertisementProvider');
  }
  return context;
};

export const AdvertisementProvider = ({ children }) => {
  const [adCache, setAdCache] = useState({});
  const loadingStatesRef = useRef({});
  const cacheRef = useRef({});
  const loadedSidesRef = useRef(new Set()); // Track which sides have been loaded

  // Keep cacheRef in sync with adCache state
  useEffect(() => {
    cacheRef.current = adCache;
  }, [adCache]);

  const fetchAdvertisements = useCallback(async (categoryId, side) => {
    // Use a side-only cache key to load once per side regardless of category
    const sideCacheKey = `side-${side}`;
    
    // Return cached data if available (persist for entire session - only cleared on page refresh)
    const cached = cacheRef.current[sideCacheKey];
    if (cached && cached.data && cached.data.length > 0) {
      // Cache persists for entire session - no expiration
      return cached.data;
    }

    // If this side has already been loaded but cache is empty, return empty array
    // This prevents infinite retries when there are no advertisements for this side
    if (loadedSidesRef.current.has(side)) {
      return cached?.data || [];
    }

    // Prevent duplicate requests - wait for existing request
    if (loadingStatesRef.current[sideCacheKey]) {
      return new Promise((resolve) => {
        const checkCache = setInterval(() => {
          const currentCache = cacheRef.current[sideCacheKey];
          if (currentCache && !loadingStatesRef.current[sideCacheKey]) {
            clearInterval(checkCache);
            resolve(currentCache.data);
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkCache);
          resolve([]);
        }, 5000);
      });
    }

    try {
      loadingStatesRef.current[sideCacheKey] = true;
      
      // Fetch all active advertisements for this side (ignore category filter after initial load)
      const params = { side };
      
      const response = await api.get('/advertisements/active', { params });
      
      const sortedAds = (response.data || [])
        .filter(ad => ad && ad.image)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      // Cache the result with side-only key
      setAdCache(prev => ({
        ...prev,
        [sideCacheKey]: {
          data: sortedAds,
          timestamp: Date.now()
        }
      }));
      
      // Mark this side as loaded
      loadedSidesRef.current.add(side);
      
      return sortedAds;
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      // Mark as loaded even on error to prevent retries
      loadedSidesRef.current.add(side);
      return [];
    } finally {
      delete loadingStatesRef.current[sideCacheKey];
    }
  }, []); // Empty dependency array - function is stable now

  const clearCache = useCallback(() => {
    setAdCache({});
  }, []);

  const clearCacheForCategory = useCallback((categoryId, side) => {
    const cacheKey = `${categoryId || 'all'}-${side}`;
    setAdCache(prev => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      return newCache;
    });
  }, []);

  return (
    <AdvertisementContext.Provider value={{
      fetchAdvertisements,
      clearCache,
      clearCacheForCategory
    }}>
      {children}
    </AdvertisementContext.Provider>
  );
};
