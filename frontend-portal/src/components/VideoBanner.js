import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import './VideoBanner.css';

const VideoBanner = () => {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await api.get('/videos?isActive=true');
      // Sort by priority (higher priority first)
      const sortedVideos = response.data.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      setVideos(sortedVideos);
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

  // Get video source URL with proper formatting
  const getVideoSource = (video) => {
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
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
      }
      return video.videoUrl;
    }
    
    // If it's a local file URL
    if (video.videoUrl.startsWith('/uploads/')) {
      return `http://localhost:5000${video.videoUrl}`;
    }
    
    // Otherwise return as is (Vimeo, etc.)
    return video.videoUrl;
  };

  // Reset video when index changes
  useEffect(() => {
    if (videos.length === 0) return;

    const currentVideo = videos[currentIndex];
    if (!currentVideo) return;

    // For local video files - these will automatically advance on end
    if (videoRef.current && currentVideo.videoUrl && !currentVideo.videoUrl.includes('youtube.com') && !currentVideo.videoUrl.includes('youtu.be')) {
      const videoSource = getVideoSource(currentVideo);
      if (videoSource) {
        videoRef.current.src = videoSource;
        videoRef.current.load();
        videoRef.current.play().catch(err => {
          console.log('Autoplay prevented:', err);
        });
      }
    }

    // For YouTube iframes, reload with autoplay parameter
    // Note: YouTube iframes don't provide reliable end event without YouTube IFrame API
    // For full sequential playback with YouTube, consider implementing YouTube IFrame Player API
    if (iframeRef.current && currentVideo.videoUrl && (currentVideo.videoUrl.includes('youtube.com') || currentVideo.videoUrl.includes('youtu.be'))) {
      const videoSource = getVideoSource(currentVideo);
      if (videoSource) {
        iframeRef.current.src = videoSource;
      }
    }
  }, [currentIndex, videos, handleVideoEnd]);

  if (loading || videos.length === 0) {
    return null;
  }

  const currentVideo = videos[currentIndex];
  const videoSource = getVideoSource(currentVideo);
  const thumbnailUrl = currentVideo?.thumbnailUrl 
    ? `http://localhost:5000${currentVideo.thumbnailUrl}` 
    : null;

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
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
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
