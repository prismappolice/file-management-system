import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardNew from './pages/DashboardNew';
import FileList from './pages/FileList';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppNew() {
  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard Route - Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardNew />
            </ProtectedRoute>
          }
        />
        
        {/* File List Route - Protected */}
        <Route
          path="/files/:category"
          element={
            <ProtectedRoute>
              <FileList />
            </ProtectedRoute>
          }
        />
        
        {/* Redirect root to dashboard or login */}
        <Route
          path="/"
          element={
            localStorage.getItem('isAuthenticated') === 'true' 
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default AppNew;
