import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const checkAuth = () => {
    const authData = localStorage.getItem('adminAuth');
    if (!authData) return false;

    try {
      const { loginTime, expiresIn } = JSON.parse(authData);
      const now = new Date().getTime();
      const isExpired = now - loginTime > expiresIn;

      if (isExpired) {
        // Clear expired login
        localStorage.removeItem('adminAuth');
        return false;
      }

      return true;
    } catch (err) {
      localStorage.removeItem('adminAuth');
      return false;
    }
  };

  return checkAuth() ? children : <Navigate to="/admin-login" replace />;
};

export default ProtectedRoute;