import React, { useState, useEffect, useRef } from 'react';
import { useAdvertisement } from '../context/AdvertisementContext';
import getImageUrl from '../utils/imageUrl';
import { preloadMedia } from '../utils/mediaCache';
import CachedImage from './CachedImage';
import './Advertisement.css';

const Advertisement = ({ categoryId, side, home = false, autoPlayInterval = 5000 }) => {
  const { fetchAdvertisements } = useAdvertisement(home ? true : false);
  const [advertisements, setAdvertisements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [sliderTransform, setSliderTransform] = useState('translateX(0%)'); // Track transform in state
  const intervalRef = useRef(null);
  const sliderRef = useRef(null);
  const hasLoadedRef = useRef(false); // Track if we've already loaded for this side
  const isLoopingRef = useRef(false); // Track if we're in a loop transition
  const initialPositionSetRef = useRef(false); // Track if initial position has been set

  // Preload all advertisement images (images will load progressively)
  useEffect(() => {
    if (advertisements.length === 0) {
      return;
    }

    // Preload images using cache system
    const imageUrls = advertisements
      .map(ad => ad && ad.image ? getImageUrl(ad.image) : null)
      .filter(Boolean);
    
    if (imageUrls.length > 0) {
      preloadMedia(imageUrls).catch(err => {
        console.warn('Failed to preload advertisement images:', err);
      });
    }
  }, [advertisements]);

  // Load advertisements only once per page load (on mount)
  useEffect(() => {
    // Only load if we haven't loaded for this side yet
    if (hasLoadedRef.current) {
      return; // Already loaded, don't reload
    }

    const loadAdvertisements = async () => {
      try {
        setLoading(true);
        // Fetch advertisements for this side, filtered by showInHome when home=true
        const ads = await fetchAdvertisements(categoryId, side, home);
        
        // Always set the ads, even if empty (to show that loading is complete)
        setAdvertisements(ads || []);
        setCurrentIndex(0);
        setIsTransitioning(false); // Disable transition for initial positioning
        isLoopingRef.current = false; // Reset looping state
        initialPositionSetRef.current = false; // Reset initial position flag
        hasLoadedRef.current = true; // Mark as loaded
        
        // Force initial position update after ads are loaded
        // Use multiple requestAnimationFrame calls to ensure DOM is ready
        if (ads && ads.length > 0) {
          // Use a small delay to ensure state updates are applied
          setTimeout(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (sliderRef.current && !initialPositionSetRef.current) {
                  const totalSlides = ads.length + 2;
                  const slideWidthPercent = 100 / totalSlides;
                  const initialTranslateX = side === 'left' 
                    ? -(1 * slideWidthPercent) // Position at first real slide (index 1)
                    : -((totalSlides - 2) * slideWidthPercent); // Position at first real slide for right side
                  
                  const transformValue = `translateX(${initialTranslateX}%)`;
                  
                  // Update state first (this will persist through re-renders)
                  setSliderTransform(transformValue);
                  
                  // Disable transition for initial positioning
                  sliderRef.current.style.transition = 'none';
                  sliderRef.current.style.transform = transformValue;
                  initialPositionSetRef.current = true; // Mark as set
                  
                  // Verify transform was applied
                  const appliedTransform = sliderRef.current.style.transform;
                  
                  if (!appliedTransform || appliedTransform === 'none') {
                    // Retry immediately
                    sliderRef.current.style.transform = transformValue;
                  }
                  
                  // Re-enable transition after positioning
                  setTimeout(() => {
                    if (sliderRef.current) {
                      sliderRef.current.style.transition = '';
                      setIsTransitioning(true);
                    }
                  }, 100);
                }
              });
            });
          }, 10);
        } else {
          setIsTransitioning(true);
        }
      } catch (error) {
        setAdvertisements([]);
        hasLoadedRef.current = true; // Mark as loaded even on error to prevent retries
      } finally {
        setLoading(false);
      }
    };

    loadAdvertisements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Update slider position
  useEffect(() => {
    // Skip if initial position hasn't been set yet (to avoid race condition)
    if (!initialPositionSetRef.current && !isTransitioning) {
      return; // Silently skip - this is expected during initial load
    }
    
    if (sliderRef.current && advertisements.length > 0) {
      const totalSlides = advertisements.length + 2; // +2 for duplicate slides
      const slideWidthPercent = 100 / totalSlides;
      
      // Calculate the transform value
      let translateX;
      
      // If we're looping (jumping from duplicate to real slide), disable transition temporarily
      if (isLoopingRef.current) {
        // Calculate position for the real first slide (index 1 in our array with duplicates)
        // For left: index 1 is the first real slide
        // For right: index 1 is also the first real slide (but it's the last in original order)
        translateX = side === 'left' 
          ? -(1 * slideWidthPercent) // Position at first real slide (index 1)
          : -((totalSlides - 2) * slideWidthPercent); // Position at first real slide for right side
        
        const transformValue = `translateX(${translateX}%)`;
        setSliderTransform(transformValue); // Update state
        
        sliderRef.current.style.transition = 'none';
        sliderRef.current.style.transform = transformValue;
        
        // Re-enable transition after a brief moment
        setTimeout(() => {
          if (sliderRef.current) {
            sliderRef.current.style.transition = '';
            isLoopingRef.current = false;
          }
        }, 50);
        return;
      }
      
      // Normal transition calculation
      // For seamless looping, we add an extra slide at each end
      // Left side: duplicate last at start (index 0), real slides (index 1-N), duplicate first at end (index N+1)
      // Right side: duplicate first at start (index 0), real slides (index 1-N), duplicate last at end (index N+1)
      let adjustedIndex;
      
      // Handle special case: currentIndex = advertisements.length means we're showing the duplicate at the end
      if (currentIndex >= advertisements.length) {
        adjustedIndex = totalSlides - 1; // Position at the last duplicate slide
      } else {
        adjustedIndex = currentIndex + 1; // Offset by 1 for duplicate at start
      }
      
      if (side === 'left') {
        // Left: slides move left
        translateX = -adjustedIndex * slideWidthPercent;
      } else {
        // Right: slides move right - reverse the calculation
        translateX = -(totalSlides - 1 - adjustedIndex) * slideWidthPercent;
      }
      
      // Update state and apply transform
      const transformValue = `translateX(${translateX}%)`;
      setSliderTransform(transformValue); // Update state to persist through re-renders
      
      if (sliderRef.current) {
        sliderRef.current.style.transform = transformValue;
      }
    }
  }, [currentIndex, advertisements.length, isTransitioning, side]);

  // Auto-play functionality
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Start auto-play if we have more than 1 advertisement
    if (advertisements.length <= 1 || isPaused || prefersReducedMotion) {
      return;
    }

    // Start auto-play - wait 2 seconds to show first image, then rotate every 5 seconds
    const startDelay = 2000;
    
    const timeoutId = setTimeout(() => {
      // Create interval that updates index every 5 seconds
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          // Calculate next index
          const nextIndex = prevIndex + 1;
          
          // If we've reached the end, loop back to start with smooth transition
          if (nextIndex >= advertisements.length) {
            // For seamless loop, we need to animate to the duplicate slide first
            // We'll use a special value to indicate we're at the duplicate
            // Then after transition, jump to index 0
            const duplicateIndex = advertisements.length; // Special value for duplicate
            setTimeout(() => {
              isLoopingRef.current = true;
              setCurrentIndex(0);
            }, 500); // Wait for transition to complete (0.5s)
            return duplicateIndex; // This triggers animation to duplicate slide
          }
          
          return nextIndex;
        });
      }, autoPlayInterval);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [advertisements.length, isPaused, autoPlayInterval, side]);

  const handleClick = (ad) => {
    if (ad.redirectUrl) {
      window.open(ad.redirectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleIndicatorClick = (index) => {
    setCurrentIndex(index);
    setIsTransitioning(true);
    // Reset auto-play timer when user manually navigates
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  if (loading) {
    return null;
  }

  if (!advertisements || advertisements.length === 0) {
    return null;
  }

  return (
    <div 
      className={`advertisement-container advertisement-${side}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="advertisement-slider-wrapper">
        <div 
          ref={sliderRef}
          className="advertisement-slider"
          style={{
            width: `${(advertisements.length + 2) * 100}%`, // +2 for duplicate slides
            transition: (isPaused || !isTransitioning || isLoopingRef.current) ? 'none' : 'transform 0.5s ease-in-out',
            // Use state-managed transform to ensure it persists through re-renders
            transform: sliderTransform
          }}
        >
          {(() => {
            // Create array with duplicates for seamless looping
            const adsArray = side === 'right' ? [...advertisements].reverse() : advertisements;
            const lastAd = adsArray[adsArray.length - 1];
            const firstAd = adsArray[0];
            
            // Left side: duplicate last at start, duplicate first at end
            // Right side: duplicate first at start, duplicate last at end
            const slidesToRender = side === 'left'
              ? [lastAd, ...adsArray, firstAd] // [duplicate last, ...real slides, duplicate first]
              : [firstAd, ...adsArray, lastAd]; // [duplicate first, ...real slides, duplicate last]
            
            return slidesToRender.map((ad, index) => {
              // Map index back to original for tracking
              let originalIndex;
              if (index === 0) {
                // First duplicate slide
                originalIndex = side === 'left' ? advertisements.length - 1 : 0;
              } else if (index === slidesToRender.length - 1) {
                // Last duplicate slide
                originalIndex = side === 'left' ? 0 : advertisements.length - 1;
              } else {
                // Real slide
                const realIndex = index - 1; // Offset by 1 for duplicate at start
                originalIndex = side === 'right' 
                  ? advertisements.length - 1 - realIndex 
                  : realIndex;
              }
              
              return (
                <div
                  key={`${ad._id || `ad-${originalIndex}`}-${index}`}
                  className={`advertisement-slide ${ad.redirectUrl ? 'clickable' : ''}`}
                  onClick={() => handleClick(ad)}
                  style={{ 
                    width: `${100 / (advertisements.length + 2)}%`,
                    minWidth: `${100 / (advertisements.length + 2)}%`,
                    maxWidth: `${100 / (advertisements.length + 2)}%`,
                    flexShrink: 0,
                    flexGrow: 0,
                    height: '100%'
                  }}
                >
                  <CachedImage 
                    src={ad.image} 
                    alt={ad.redirectUrl ? `Advertisement - ${ad.redirectUrl}` : 'Advertisement'} 
                    className="advertisement-image"
                    style={{
                      display: 'block',
                      visibility: 'visible',
                      opacity: 1,
                      width: '100%',
                      height: '100%'
                    }}
                    onError={(e) => {
                      // Show broken image icon
                      e.target.style.opacity = '0.3';
                    }}
                    onLoad={(e) => {
                      // Ensure image is visible once loaded - force it with !important via setProperty
                      e.target.style.setProperty('display', 'block', 'important');
                      e.target.style.setProperty('visibility', 'visible', 'important');
                      e.target.style.setProperty('opacity', '1', 'important');
                    }}
                  />
                </div>
              );
            });
          })()}
        </div>
      </div>
      
      {/* Indicator dots */}
      {advertisements.length > 1 && (
        <div className="advertisement-indicators">
          {advertisements.map((_, index) => (
            <button
              key={`indicator-${index}`}
              className={`advertisement-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleIndicatorClick(index);
              }}
              aria-label={`Go to advertisement ${index + 1}`}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
// Compare props to determine if re-render is needed
export default React.memo(Advertisement, (prevProps, nextProps) => {
  // Only re-render if side or categoryId changes
  return prevProps.side === nextProps.side && 
         prevProps.categoryId === nextProps.categoryId &&
         prevProps.autoPlayInterval === nextProps.autoPlayInterval;
});
