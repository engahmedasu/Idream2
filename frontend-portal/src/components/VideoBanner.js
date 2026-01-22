import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import getImageUrl, { getCachedImageUrl } from '../utils/imageUrl';
import { getCachedMedia, preloadMedia } from '../utils/mediaCache';
import './VideoBanner.css';

const VideoBanner = ({ categoryId = null }) => {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoSource, setVideoSource] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    fetchVideos();
  }, [categoryId]);

  const fetchVideos = async () => {
    try {
      const params = { isActive: true };
      if (categoryId) {
        params.category = categoryId;
      }
      const response = await api.get('/videos', { params });
      // Sort by priority (higher priority first)
      const sortedVideos = response.data.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      setVideos(sortedVideos);
      
      // Preload and cache video URLs and thumbnails
      const urlsToCache = sortedVideos
        .map(video => {
          const urls = [];
          // Cache local video files (not YouTube/Vimeo)
          if (video.videoUrl && !video.videoUrl.includes('youtube.com') && !video.videoUrl.includes('youtu.be') && !video.videoUrl.includes('vimeo.com')) {
            if (video.videoUrl.startsWith('/uploads/')) {
              urls.push(getImageUrl(video.videoUrl));
            } else if (video.videoUrl.startsWith('http://') || video.videoUrl.startsWith('https://')) {
              urls.push(video.videoUrl);
            }
          }
          // Cache thumbnails
          if (video.thumbnailUrl) {
            urls.push(getImageUrl(video.thumbnailUrl));
          }
          return urls;
        })
        .flat();
      
      // Preload in background (don't wait)
      preloadMedia(urlsToCache).catch(err => {
        console.warn('Failed to preload some media:', err);
      });
      
      // Reset to first video when category changes
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle video end event - move to next video (loops back to start when reaching end)
  const handleVideoEnd = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  }, [videos.length]);

  // Get video source URL with proper formatting (async for cached local videos)
  const getVideoSource = async (video) => {
    if (!video?.videoUrl) return null;
    
    // If it's a YouTube URL
    if (video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be')) {
      let videoId = '';
      
      if (video.videoUrl.includes('youtu.be/')) {
        videoId = video.videoUrl.split('youtu.be/')[1].split('?')[0];
      } else if (video.videoUrl.includes('youtube.com/watch')) {
        videoId = video.videoUrl.split('v=')[1].split('&')[0];
      } else if (video.videoUrl.includes('youtube.com/embed')) {
        const match = video.videoUrl.match(/embed\/([^?]+)/);
        videoId = match ? match[1] : '';
      }
      
      if (videoId) {
        // Don't use loop parameter - we want sequential playback, not looping individual videos
        // Disable controls and browser actions
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&controls=0&modestbranding=1&disablekb=1&playsinline=1`;
      }
      return video.videoUrl;
    }
    
    // If it's a local file URL, try to get cached version
    if (video.videoUrl.startsWith('/uploads/')) {
      const fullUrl = getImageUrl(video.videoUrl);
      try {
        return await getCachedMedia(fullUrl);
      } catch (error) {
        console.warn('Failed to get cached video, using original:', error);
        return fullUrl;
      }
    }
    
    // For external URLs (not YouTube), try to cache
    if (video.videoUrl.startsWith('http://') || video.videoUrl.startsWith('https://')) {
      try {
        return await getCachedMedia(video.videoUrl);
      } catch (error) {
        console.warn('Failed to get cached video, using original:', error);
        return video.videoUrl;
      }
    }
    
    // Otherwise return as is (Vimeo, etc.)
    return video.videoUrl;
  };

  // Reset video when index changes
  useEffect(() => {
    if (videos.length === 0) return;

    const currentVideo = videos[currentIndex];
    if (!currentVideo) return;

    const loadVideo = async () => {
      // For local video files - these will automatically advance on end
      if (videoRef.current && currentVideo.videoUrl && !currentVideo.videoUrl.includes('youtube.com') && !currentVideo.videoUrl.includes('youtu.be')) {
        const videoSource = await getVideoSource(currentVideo);
        if (videoSource) {
          const video = videoRef.current;
          const currentSrc = video.src || video.currentSrc;
          
          // Only reload if the source has changed
          if (currentSrc !== videoSource) {
            // Pause and reset current time to prevent conflicts
            video.pause();
            video.currentTime = 0;
            
            // Remove any existing event listeners to prevent conflicts
            const handleCanPlay = () => {
              // Use requestAnimationFrame to ensure DOM is ready
              requestAnimationFrame(() => {
                video.play().catch(err => {
                  // Only log if it's not an AbortError (which is expected when interrupted)
                  if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
                    console.log('Autoplay prevented:', err);
                  }
                });
              });
              video.removeEventListener('canplay', handleCanPlay);
            };
            
            // Wait for video to be ready before playing
            video.addEventListener('canplay', handleCanPlay, { once: true });
            
            // Set source and load
            video.src = videoSource;
            video.load();
          } else if (video.paused) {
            // If same source but paused, just resume
            video.play().catch(err => {
              if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
                console.log('Autoplay prevented:', err);
              }
            });
          }
        }
      }

      // For YouTube iframes, reload with autoplay parameter
      // Note: YouTube iframes don't provide reliable end event without YouTube IFrame API
      // For full sequential playback with YouTube, consider implementing YouTube IFrame Player API
      if (iframeRef.current && currentVideo.videoUrl && (currentVideo.videoUrl.includes('youtube.com') || currentVideo.videoUrl.includes('youtu.be'))) {
        const videoSource = await getVideoSource(currentVideo);
        if (videoSource && iframeRef.current.src !== videoSource) {
          iframeRef.current.src = videoSource;
        }
      }
    };

    loadVideo();
  }, [currentIndex, videos, handleVideoEnd]);

  const currentVideo = videos[currentIndex];

  // Load cached video source and thumbnail when video changes
  useEffect(() => {
    if (!currentVideo) {
      setVideoSource(null);
      setThumbnailUrl(null);
      return;
    }

    const loadMedia = async () => {
      const source = await getVideoSource(currentVideo);
      setVideoSource(source);
      
      if (currentVideo.thumbnailUrl) {
        try {
          const cached = await getCachedImageUrl(currentVideo.thumbnailUrl);
          setThumbnailUrl(cached);
        } catch (error) {
          setThumbnailUrl(getImageUrl(currentVideo.thumbnailUrl));
        }
      } else {
        setThumbnailUrl(null);
      }
    };
    loadMedia();
  }, [currentVideo, currentIndex]);

  if (loading || videos.length === 0) {
    return null;
  }

  const isYouTube = videoSource?.includes('youtube.com/embed');
  const isVimeo = videoSource?.includes('vimeo.com');

  return (
    <div className="video-banner">
      <div className="video-banner-slide">
        {videoSource ? (
          <div className="video-container">
            {isYouTube || isVimeo ? (
              <iframe
                ref={iframeRef}
                src={videoSource}
                title={currentVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                allowFullScreen={false}
                className="video-iframe"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
                className="video-element"
                poster={thumbnailUrl || undefined}
                key={currentIndex}
                controls={false}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                onContextMenu={(e) => e.preventDefault()}
              >
                <source src={videoSource} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        ) : thumbnailUrl ? (
          <div className="video-container">
            <img src={thumbnailUrl} alt={currentVideo.title} className="video-thumbnail" />
          </div>
        ) : null}
      </div>

      {videos.length > 1 && (
        <div className="video-banner-indicators">
          {videos.map((_, index) => (
            <button
              key={index}
              className={`video-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoBanner;
