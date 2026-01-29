import { useState, useEffect } from 'react';

/**
 * Hook to detect mobile/portrait layout mode
 *
 * MOBILE layout when:
 * - viewport width <= 480px, OR
 * - portrait orientation (height > width) AND width <= 768px
 */
export function useMobileLayout(): boolean {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false;
        return checkMobileLayout();
    });

    useEffect(() => {
        function handleResize() {
            setIsMobile(checkMobileLayout());
        }

        window.addEventListener('resize', handleResize);
        // Also listen for orientation changes
        window.addEventListener('orientationchange', handleResize);

        // Initial check
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    return isMobile;
}

function checkMobileLayout(): boolean {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;

    // Mobile if narrow, or portrait on tablet-sized screens
    return width <= 480 || (isPortrait && width <= 768);
}
