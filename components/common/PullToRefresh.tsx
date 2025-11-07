
import React, { useState, useEffect, useCallback } from 'react';
import { Loader } from 'lucide-react';

const PULL_THRESHOLD = 80; // The distance in pixels to pull before a refresh is triggered
const REFRESH_TIMEOUT = 1000; // How long to show the spinner before reloading

const PullToRefresh: React.FC = () => {
  const [pullStart, setPullStart] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start tracking if we are at the top of the page
    if (window.scrollY === 0) {
      setPullStart(e.targetTouches[0].clientY);
    } else {
      setPullStart(null);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (pullStart === null) return;

    const currentY = e.targetTouches[0].clientY;
    const distance = currentY - pullStart;

    if (distance > 0) {
      // Prevent default scroll behavior while pulling down
      e.preventDefault();
      setPullDistance(distance);
    }
  }, [pullStart]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > PULL_THRESHOLD) {
      setIsRefreshing(true);
      // Wait for the animation to be visible, then reload
      setTimeout(() => {
        window.location.reload();
      }, REFRESH_TIMEOUT);
    } else {
      // Not pulled far enough, reset
      setPullStart(null);
      setPullDistance(0);
    }
  }, [pullDistance]);

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false }); // passive: false is needed for preventDefault
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const rotation = Math.min(pullDistance, PULL_THRESHOLD * 1.5);
  const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-16 flex items-center justify-center transition-transform duration-300 z-[99]"
      style={{
        transform: `translateY(${isRefreshing ? '0px' : Math.min(pullDistance / 2.5, PULL_THRESHOLD / 2.5) - 40}px)`,
        opacity: isRefreshing ? 1 : opacity,
      }}
    >
      <div className="bg-white rounded-full shadow-lg p-3">
        <Loader
          size={24}
          className="text-blue-600 transition-transform"
          style={{
            transform: isRefreshing ? 'rotate(360deg)' : `rotate(${rotation}deg)`,
            transition: isRefreshing ? 'transform 1s linear infinite' : 'none',
          }}
        />
      </div>
    </div>
  );
};

export default PullToRefresh;
