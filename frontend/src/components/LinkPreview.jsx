import { useState, useEffect, useMemo } from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Component that displays a preview card for URLs with metadata
 * Embeds videos for supported platforms (YouTube, Vimeo, etc.)
 */
const LinkPreview = ({ url, isOwnMessage }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Check if URL is embeddable video
  const embedInfo = useMemo(() => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase().replace('www.', '');

      // YouTube
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        let videoId = null;
        
        if (hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1).split('?')[0];
        } else if (urlObj.searchParams.has('v')) {
          videoId = urlObj.searchParams.get('v');
        } else {
          const match = urlObj.pathname.match(/\/embed\/([^/?]+)/);
          if (match) videoId = match[1];
        }

        if (videoId) {
          return {
            type: 'youtube',
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
          };
        }
      }

      // Vimeo
      if (hostname.includes('vimeo.com')) {
        const match = urlObj.pathname.match(/\/(\d+)/);
        if (match) {
          return {
            type: 'vimeo',
            embedUrl: `https://player.vimeo.com/video/${match[1]}`,
          };
        }
      }

      // Twitch
      if (hostname.includes('twitch.tv')) {
        const match = urlObj.pathname.match(/\/videos\/(\d+)/);
        if (match) {
          return {
            type: 'twitch',
            embedUrl: `https://player.twitch.tv/?video=${match[1]}&parent=${window.location.hostname}`,
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  }, [url]);

  useEffect(() => {
    // Skip fetching preview if it's an embeddable video
    if (embedInfo) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(false);

        // Call backend API to fetch metadata
        const response = await fetch(`/api/link/preview?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch preview');
        }

        const data = await response.json();
        
        if (!cancelled) {
          setPreview(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      cancelled = true;
    };
  }, [url, embedInfo]);

  // Show embedded video
  if (embedInfo) {
    return (
      <div className={`mt-2 rounded-lg overflow-hidden ${
        isOwnMessage 
          ? 'bg-primary-content/10 border border-primary-content/20' 
          : 'bg-base-200 border border-base-300'
      }`}>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedInfo.embedUrl}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded video"
          />
        </div>
        <div className="p-2 text-xs flex items-center gap-1 text-blue-500">
          <ExternalLink className="w-3 h-3" />
          <a href={url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
            {new URL(url).hostname}
          </a>
        </div>
      </div>
    );
  }

  // Don't show anything while loading or if error
  if (loading || error || !preview) {
    return null;
  }

  // Don't show if no useful data
  if (!preview.title && !preview.description && !preview.image) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block mt-2 rounded-lg border overflow-hidden hover:shadow-lg transition-all ${
        isOwnMessage 
          ? 'bg-primary-content/10 border-primary-content/20 hover:border-primary-content/40' 
          : 'bg-base-200 border-base-300 hover:border-base-content/30'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Image */}
      {preview.image && (
        <div className="w-full h-48 bg-base-300 overflow-hidden">
          <img
            src={preview.image}
            alt={preview.title || 'Preview'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        {preview.title && (
          <div className={`font-semibold text-sm mb-1 line-clamp-2 ${
            isOwnMessage ? 'text-primary-content' : 'text-base-content'
          }`}>
            {preview.title}
          </div>
        )}

        {/* Description */}
        {preview.description && (
          <div className={`text-xs mb-2 line-clamp-2 ${
            isOwnMessage ? 'text-primary-content/70' : 'text-base-content/60'
          }`}>
            {preview.description}
          </div>
        )}

        {/* URL */}
        <div className="flex items-center gap-1 text-xs text-blue-500">
          <ExternalLink className="w-3 h-3" />
          <span className="truncate">{new URL(url).hostname}</span>
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;
