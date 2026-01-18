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

  const fetchAdvertisements = useCallback(async (categoryId, side, home = false) => {
    // Use cache key that includes categoryId/home flag and side
    // This ensures different categories/home get their own cached ads
    const cacheKey = home ? `home-${side}` : `${categoryId || 'all'}-${side}`;
    
    // Return cached data if available (persist for entire session - only cleared on page refresh)
    const cached = cacheRef.current[cacheKey];
    if (cached && cached.data) {
      // Cache persists for entire session - no expiration
      return cached.data;
    }

    // If this category-side combination has already been loaded but cache is empty, return empty array
    // This prevents infinite retries when there are no advertisements for this category-side
    if (loadedSidesRef.current.has(cacheKey)) {
      return cached?.data || [];
    }

    // Prevent duplicate requests - wait for existing request
    if (loadingStatesRef.current[cacheKey]) {
      return new Promise((resolve) => {
        const checkCache = setInterval(() => {
          const currentCache = cacheRef.current[cacheKey];
          if (currentCache && !loadingStatesRef.current[cacheKey]) {
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
      loadingStatesRef.current[cacheKey] = true;
      
      // Fetch active advertisements for this side, filtered by category or home flag
      const params = { side };
      if (home) {
        params.home = 'true';
      } else if (categoryId) {
        params.category = categoryId;
      }
      
      const response = await api.get('/advertisements/active', { params });
      
      const sortedAds = (response.data || [])
        .filter(ad => ad && ad.image)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      // Cache the result with category-side key
      setAdCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: sortedAds,
          timestamp: Date.now()
        }
      }));
      
      // Mark this category-side combination as loaded
      loadedSidesRef.current.add(cacheKey);
      
      return sortedAds;
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      // Mark as loaded even on error to prevent retries
      loadedSidesRef.current.add(cacheKey);
      return [];
    } finally {
      delete loadingStatesRef.current[cacheKey];
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
