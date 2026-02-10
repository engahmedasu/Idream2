import React, { useState } from 'react';
import getImageUrl from '../utils/imageUrl';
import config from '../config/app';
import './OptimizedVideo.css';

/**
 * Optimized video: show thumbnail + play icon; load video only on click.
 * Uses preload="metadata", default 480p; optional 720p switch.
 * Do not autoplay in listing.
 */
const OptimizedVideo = ({
  thumbnailUrl,
  video480Url,
  video720Url,
  alt = 'Video',
  className = '',
  defaultQuality = '480p',
  ...props
}) => {
  const [playing, setPlaying] = useState(false);
  const [quality, setQuality] = useState(defaultQuality);
  const src = quality === '720p' && video720Url ? video720Url : (video480Url || video720Url);
  const fullSrc = src && !src.startsWith('http') ? `${config.imageBaseURL || ''}${src}` : src;
  const thumbSrc = thumbnailUrl ? getImageUrl(thumbnailUrl) : '';

  const handlePlay = (e) => {
    e.preventDefault();
    setPlaying(true);
  };

  if (!fullSrc) return null;

  if (!playing) {
    return (
      <div
        className={`optimized-video optimized-video-poster ${className}`}
        onClick={handlePlay}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handlePlay(e)}
        aria-label="Play video"
      >
        {thumbSrc && (
          <img
            src={thumbSrc}
            alt={alt}
            className="optimized-video-thumb"
            loading="lazy"
          />
        )}
        <span className="optimized-video-play-icon" aria-hidden>▶</span>
      </div>
    );
  }

  return (
    <div className={`optimized-video optimized-video-playing ${className}`}>
      <video
        controls
        preload="metadata"
        playsInline
        src={fullSrc}
        {...props}
      >
        Your browser does not support the video tag.
      </video>
      {video720Url && video480Url && (
        <button
          type="button"
          className="optimized-video-quality-toggle"
          onClick={() => setQuality((q) => (q === '480p' ? '720p' : '480p'))}
        >
          {quality}
        </button>
      )}
    </div>
  );
};

export default OptimizedVideo;
