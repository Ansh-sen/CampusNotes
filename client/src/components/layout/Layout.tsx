import { useRef, useEffect, useState } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // Immediate reset for all potential scroll containers
    window.scrollTo(0, 0);
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);

    const scrollReset = () => {
      window.scrollTo(0, 0);
      if (mainRef.current) {
        mainRef.current.scrollTo(0, 0);
      }
    };

    requestAnimationFrame(scrollReset);
    const timer = setTimeout(scrollReset, 50);

    const handleViewportResize = () => {
      if (window.visualViewport) {
        setIsKeyboardOpen(window.visualViewport.height < window.innerHeight * 0.8);
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportResize);
    
    return () => {
      clearTimeout(timer);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, [pathname]);

  const isChatThread = pathname === '/messages' && new URLSearchParams(location.search).get('conv');
  
  return (
    <div className="flex flex-col min-h-[100dvh] w-full max-w-2xl mx-auto bg-background border-x border-border/50 relative shadow-sm">
      <Header />
      <main 
        ref={mainRef} 
        className={cn(
          "flex-1 w-full overflow-x-hidden",
          isChatThread ? "overflow-y-hidden pb-0" : "pb-20 overflow-y-auto"
        )}
      >
        <Outlet />
      </main>
      {!isChatThread && !isKeyboardOpen && <BottomNav />}
    </div>
  );
}
