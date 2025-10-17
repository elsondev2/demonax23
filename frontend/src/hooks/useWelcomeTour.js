import { useState, useEffect } from 'react';

const TOUR_STORAGE_KEY = 'de_monax_welcome_tour_completed';

export function useWelcomeTour() {
  const [showTour, setShowTour] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user has completed the tour
    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
    
    if (!hasCompletedTour) {
      // Small delay to let the page load first
      setTimeout(() => {
        setShowTour(true);
        setIsChecking(false);
      }, 500);
    } else {
      setIsChecking(false);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setShowTour(false);
  };

  const skipTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setShowTour(false);
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setShowTour(true);
  };

  return {
    showTour,
    isChecking,
    completeTour,
    skipTour,
    resetTour,
  };
}
