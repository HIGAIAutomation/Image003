// Fix for Vite env typing
interface ImportMeta {
  env: {
    VITE_API_URL: string;
  };
}
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const res = await fetch(`${API_URL}api/admin-auth`, {
          method: 'GET',
          credentials: 'include',
        });
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, []);

  if (!authChecked) return null; // Or a loading spinner
  return isAuthenticated ? children : <Navigate to="/admin-login" replace />;
};

export default ProtectedRoute;