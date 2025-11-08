import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import type { User } from '@/types';
import { BookOpenIcon, UserIcon } from './icons';

interface HeaderProps {
  user: User | null;
  onLogin?: () => void;
  onLogout: () => void;
  onViewProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout, onViewProfile }): JSX.Element => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect((): (() => void) => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current != null && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BookOpenIcon className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-bold text-slate-800">FlashLearn AI</span>
        </div>
        <div>
          {user != null ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(): void => {
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className="text-sm font-medium hidden sm:block">{user.name}</span>
                <img
                  src={
                    user.avatar != null && user.avatar !== '' ? user.avatar : '/icon-192.png'
                  }
                  alt="User avatar"
                  className="w-9 h-9 rounded-full border-2 border-indigo-200"
                />
              </button>
              {isDropdownOpen === true && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 animate-fade-in p-2 z-10">
                  <button
                    onClick={(): void => {
                      onViewProfile();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    <UserIcon className="w-5 h-5" />
                    Profile
                  </button>
                  <button
                    onClick={(): void => {
                      onLogout();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 rounded-md transition-colors mt-1"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-transform transform hover:scale-105"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
