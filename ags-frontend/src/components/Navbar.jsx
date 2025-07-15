import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-white font-bold text-xl hover:scale-105 transition-transform"
          >
            <GraduationCap size={32} className="text-yellow-300" />
            <span className="bg-gradient-to-r from-yellow-300 to-white bg-clip-text text-transparent">
              AGS
            </span>
          </Link>
          
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-white/80">Welcome, {user.username}!</span>
              <button
                onClick={handleLogout}
                className="glass-button flex items-center space-x-2 text-sm"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;