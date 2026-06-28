import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LayoutDashboard, Users, LogOut, LogIn, UserPlus } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <GraduationCap className="nav-brand-logo" size={32} />
        <span>CollabStudy</span>
      </Link>

      <div className="nav-links">
        {user ? (
          <>
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            
            <NavLink 
              to="/groups" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>Groups</span>
            </NavLink>

            <div className="nav-user">
              <div className="nav-profile">
                <img 
                  src={user.avatar || 'https://via.placeholder.com/150'} 
                  alt={user.name} 
                  className="nav-avatar"
                />
                <span className="nav-username">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <NavLink 
              to="/login" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <LogIn size={18} />
              <span>Login</span>
            </NavLink>
            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
              <UserPlus size={16} />
              <span>Sign Up</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
