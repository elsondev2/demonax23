import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const SwipeIndicator = ({ currentTab, totalTabs }) => {
  const [showIndicator, setShowIndicator] = useState(true);

  useEffect(() => {
    // Hide indicator after 5 seconds
    const timer = setTimeout(() => setShowIndicator(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!showIndicator) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (!isMobile) return null;

  return (
    <div className="fixed top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none z-30 flex justify-between px-4">
      {currentTab > 0 && (
        <div className="bg-base-200/80 backdrop-blur-sm rounded-full p-2 shadow-lg animate-pulse">
          <ChevronLeft className="w-6 h-6 text-base-content/60" />
        </div>
      )}
      <div className="flex-1" />
      {currentTab < totalTabs - 1 && (
        <div className="bg-base-200/80 backdrop-blur-sm rounded-full p-2 shadow-lg animate-pulse">
          <ChevronRight className="w-6 h-6 text-base-content/60" />
        </div>
      )}
    </div>
  );
};

export default SwipeIndicator;
