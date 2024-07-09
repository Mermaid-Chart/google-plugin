import { useEffect } from 'react';

export const useURLChange = (callback: (url: string) => void) => {
  useEffect(() => {
    const handleURLChange = () => {
      callback(window.location.pathname + window.location.search);
    };

    // Listen for popstate event (back/forward navigation)
    window.addEventListener('popstate', handleURLChange);

    // Override pushState and replaceState to listen for programmatic URL changes
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      handleURLChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(window.history, args);
      handleURLChange();
    };

    // Initial URL
    handleURLChange();

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('popstate', handleURLChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [callback]);
};
