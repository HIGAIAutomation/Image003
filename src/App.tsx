// File: src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './components/Home';
import SendPosters from './components/SendPosters';
import MemberRegistration from './components/MemberRegistration';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import { useState } from 'react';
import ProtectedRoute from './components/ProtectedRoute';


const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="bg-gradient-to-r from-green-400 to-blue-500 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 text-white font-bold text-xl">
            Abu Portal
          </div>
          <div className="hidden md:flex gap-6">
            <NavLink to="/" label="Home" active={location.pathname === '/'} />
            <NavLink to="/send-poster" label="Send Poster" active={location.pathname === '/send-poster'} />
            <NavLink to="/register" label="Register Member" active={location.pathname === '/register'} />
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen(!open)}
              className="text-white focus:outline-none"
              aria-label="Toggle navigation"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="md:hidden px-4 pb-4">
          <NavLink to="/" label="Home" active={location.pathname === '/'} />
          <NavLink to="/send-poster" label="Send Poster" active={location.pathname === '/send-poster'} />
          <NavLink to="/register" label="Register Member" active={location.pathname === '/register'} />
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ to, label, active }: { to: string; label: string; active: boolean }) => (
  <Link
    to={to}
    className={`block px-3 py-2 rounded-md text-base font-medium transition ${
      active
        ? 'bg-white text-blue-600 shadow'
        : 'text-white hover:bg-blue-600 hover:text-white'
    }`}
  >
    {label}
  </Link>
);

function App() {
  return (
    <Router>
      <Navbar />
      <main className="h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-gray-100 overflow-hidden">
        <div className="w-full max-w-2xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/send-poster" element={<SendPosters />} />
            <Route path="/register" element={<MemberRegistration />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </main>
    </Router>
  );
}

export default App;

fetch('http://localhost:3001/api/users')
