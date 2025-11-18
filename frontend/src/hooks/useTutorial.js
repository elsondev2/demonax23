import { useState, useEffect } from 'react';

const TUTORIAL_STORAGE_KEY = 'demonax_tutorial_completed';

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    // Check if user has completed tutorial
    const tutorialCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    
    if (!tutorialCompleted) {
      setIsFirstVisit(true);
      // Show tutorial after a short delay for better UX
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
    setIsFirstVisit(false);
  };

  const skipTutorial = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
    setIsFirstVisit(false);
  };

  const restartTutorial = () => {
    setShowTutorial(true);
  };

  const resetTutorial = () => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    setIsFirstVisit(true);
    setShowTutorial(true);
  };

  return {
    showTutorial,
    isFirstVisit,
    completeTutorial,
    skipTutorial,
    restartTutorial,
    resetTutorial,
  };
}
