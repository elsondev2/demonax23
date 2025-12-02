import { useEffect, useState } from 'react';

/**
 * Track whether we should prompt the user to rotate their device for the piano experience.
 * Returns the current portrait state plus helpers for dismissing the prompt.
 */
export const useOrientationPrompt = ({ breakpoint = 900 } = {}) => {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const sizeQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const orientationQuery = window.matchMedia('(orientation: portrait)');

    const updateState = () => {
      setIsPortraitMobile(sizeQuery.matches && orientationQuery.matches);
    };

    updateState();

    const add = (query, handler) => {
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', handler);
      } else if (typeof query.addListener === 'function') {
        query.addListener(handler);
      }
    };

    const remove = (query, handler) => {
      if (typeof query.removeEventListener === 'function') {
        query.removeEventListener('change', handler);
      } else if (typeof query.removeListener === 'function') {
        query.removeListener(handler);
      }
    };

    add(sizeQuery, updateState);
    add(orientationQuery, updateState);

    return () => {
      remove(sizeQuery, updateState);
      remove(orientationQuery, updateState);
    };
  }, [breakpoint]);

  useEffect(() => {
    if (!isPortraitMobile) {
      setDismissed(false);
    }
  }, [isPortraitMobile]);

  return {
    isPortraitMobile,
    showPrompt: isPortraitMobile && !dismissed,
    dismissPrompt: () => setDismissed(true),
  };
};
