import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppContext } from '../contexts/AppContext';
import { BookOpenIcon, MenuIcon } from './icons';

const LiveClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };

  return (
    <div className="bg-base-200 text-base-content text-sm text-center px-6 py-1 border-b border-base-300 font-mono tracking-wider print-hide">
      {currentTime.toLocaleString('en-US', options)}
    </div>
  );
};


const Layout: React.FC = () => {
  const { uiState } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isMobileOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className={`flex-1 w-full flex flex-col transition-all duration-300 ${uiState.isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Mobile/Tablet Header */}
        <div className="lg:hidden flex items-center justify-between p-2 bg-base-200 border-b border-base-300 sticky top-0 z-30 print-hide">
            <div className="flex items-center gap-2">
                <BookOpenIcon className="w-7 h-7 text-primary" />
                <h1 className="text-lg font-bold">
                    <span className="text-white">Teacher's</span>
                    <span className="text-primary"> HUB</span>
                </h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2">
                <MenuIcon className="w-6 h-6" />
            </button>
        </div>
        <LiveClock />
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;