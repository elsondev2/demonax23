import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import { X, AlertTriangle, Info, ExternalLink } from 'lucide-react';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [visibleAnnouncements, setVisibleAnnouncements] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load dismissed announcements from localStorage
  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    setVisibleAnnouncements(prev => prev.filter(id => !dismissed.includes(id)));
  }, [announcements]);

  // Fetch announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/notices/announcements');
      // Filter for urgent and high priority announcements only
      const urgentAndHighPriority = response.data.filter(
        announcement => announcement.priority === 'urgent' || announcement.priority === 'high'
      );
      setAnnouncements(urgentAndHighPriority);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAnnouncement = (announcementId) => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    const updatedDismissed = [...dismissed, announcementId];
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(updatedDismissed));

    setVisibleAnnouncements(prev => prev.filter(id => id !== announcementId));

    // Hide banner if no visible announcements left
    if (visibleAnnouncements.length <= 1) {
      setIsVisible(false);
    }
  };

  const dismissAllAnnouncements = () => {
    const allIds = announcements.map(announcement => announcement._id);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(allIds));
    setVisibleAnnouncements([]);
    setIsVisible(false);
  };

  const viewAnnouncementDetails = (announcementId) => {
    navigate(`/notices?highlight=${announcementId}`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="h-4 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  // Don't show banner if no visible announcements
  if (!isVisible || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 relative overflow-hidden z-40">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-black/10 animate-pulse"></div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Priority indicator and content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Priority indicator */}
            <div className="flex-shrink-0">
              {announcements.find(a => a._id === visibleAnnouncements[0])?.priority === 'urgent' ? (
                <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
              ) : (
                <Info className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Announcement content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-white text-sm md:text-base truncate">
                  {announcements.find(a => a._id === visibleAnnouncements[0])?.title}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  announcements.find(a => a._id === visibleAnnouncements[0])?.priority === 'urgent'
                    ? 'bg-red-800 text-white'
                    : 'bg-orange-800 text-white'
                }`}>
                  {announcements.find(a => a._id === visibleAnnouncements[0])?.priority?.toUpperCase()}
                </span>
              </div>
              <p className="text-white/90 text-xs md:text-sm line-clamp-1">
                {announcements.find(a => a._id === visibleAnnouncements[0])?.content}
              </p>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => viewAnnouncementDetails(visibleAnnouncements[0])}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md text-xs md:text-sm font-medium transition-colors"
              aria-label="View announcement details"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">View</span>
            </button>

            <button
              onClick={() => dismissAnnouncement(visibleAnnouncements[0])}
              className="p-1.5 hover:bg-white/20 text-white rounded-md transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multiple announcements indicator */}
        {visibleAnnouncements.length > 1 && (
          <div className="mt-2 flex items-center justify-between text-xs text-white/80">
            <span>{visibleAnnouncements.length} active announcements</span>
            <button
              onClick={dismissAllAnnouncements}
              className="underline hover:no-underline"
            >
              Dismiss all
            </button>
          </div>
        )}
      </div>

      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-black/20 to-transparent"></div>
    </div>
  );
};

export default AnnouncementBanner;