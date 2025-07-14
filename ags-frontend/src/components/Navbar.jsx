import { Link } from 'react-router-dom'
import { GraduationCap, LogOut } from 'lucide-react'

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="bg-white/95 backdrop-blur-xl border-b border-white/20 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent"
          >
            <GraduationCap className="h-8 w-8 text-primary-500" />
            <span>AGS</span>
          </Link>

          {/* User section */}
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">
                Welcome, {user.username}!
              </span>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary-500 transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar