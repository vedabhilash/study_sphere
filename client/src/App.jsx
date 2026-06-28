import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import GroupsPage from './pages/GroupsPage';
import GroupDetailsPage from './pages/GroupDetailsPage';

// Profile Pages
import PersonalDetails from './pages/profile/PersonalDetails';
import MyCourses from './pages/profile/MyCourses';
import StudyPreferences from './pages/profile/StudyPreferences';
import WeeklyAvailability from './pages/profile/WeeklyAvailability';
import PrivacyVisibility from './pages/profile/PrivacyVisibility';

// Placeholders
import MatchFinder from './pages/MatchFinder';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            border: '4px solid rgba(99, 102, 241, 0.1)', 
            borderLeftColor: 'var(--primary)', 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px', 
            animation: 'spin 1s linear infinite', 
            marginBottom: '12px' 
          }}></div>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading StudySphere...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="app-container-auth">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content-wrapper">
          <MobileHeader onToggleSidebar={() => setSidebarOpen(true)} />
          <div className="page-content-area">
            <Routes>
              {/* Authenticated routes */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
              <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailsPage /></ProtectedRoute>} />
              
              {/* Profile routes */}
              <Route path="/profile/personal-details" element={<ProtectedRoute><PersonalDetails /></ProtectedRoute>} />
              <Route path="/profile/courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
              <Route path="/profile/preferences" element={<ProtectedRoute><StudyPreferences /></ProtectedRoute>} />
              <Route path="/profile/availability" element={<ProtectedRoute><WeeklyAvailability /></ProtectedRoute>} />
              <Route path="/profile/privacy" element={<ProtectedRoute><PrivacyVisibility /></ProtectedRoute>} />
              
              {/* Other Navigation routes */}
              <Route path="/match-finder" element={<ProtectedRoute><MatchFinder /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated Flow
  return (
    <div className="app-container-public">
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
