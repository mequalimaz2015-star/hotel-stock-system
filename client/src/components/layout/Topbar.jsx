import React, { useState } from 'react';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const Topbar = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-ink-500 hover:bg-ink-50 lg:hidden"
        >
          <Menu size={22} />
        </button>
        <div>
          <p className="font-display text-xl text-ink-900">{title}</p>
          <p className="text-sm text-ink-400">{greeting()}, {user?.name?.split(' ')[0]}</p>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-ink-100 py-1.5 pl-1.5 pr-3 hover:bg-ink-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-800 text-sm font-semibold text-brass-300">
            {user?.name?.[0]?.toUpperCase()}
          </span>
          <span className="hidden text-sm font-medium text-ink-700 sm:inline">{user?.name}</span>
          <ChevronDown size={16} className="text-ink-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-lg border border-ink-100 bg-white py-1 shadow-soft">
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
