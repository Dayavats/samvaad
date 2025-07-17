import './App.css'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Chat from './pages/Chat';
import Share from './pages/Share';
import Connect from './pages/Connect';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './AuthContext';
import { ChatSocketProvider } from './ChatSocketContext';
import AdminDashboard from './pages/AdminDashboard';

function AppNav() {
  const { user, logout } = useAuth();
  return (
    <nav className="app-nav">
      <Link to="/">Home</Link>
      {user && <Link to="/feed">Feed</Link>}
      {user && <Link to="/chat">Chat</Link>}
      {user && <Link to="/share">Share</Link>}
      {user && <Link to="/connect">Connect</Link>}
      {user && <Link to="/profile">Profile</Link>}
      {user && user.role === 'admin' && <Link to="/admin">Admin</Link>}
      {!user && <Link to="/login">Login</Link>}
      {!user && <Link to="/register">Register</Link>}
      {user && <button className="logout-btn" onClick={logout}>Logout</button>}
    </nav>
  );
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user && user.role === 'admin' ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/share" element={<PrivateRoute><Share /></PrivateRoute>} />
        <Route path="/connect" element={<PrivateRoute><Connect /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/login" element={<LoginWithAuth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
    </main>
  );
}

// Wrap Login to use AuthContext and redirect
function LoginWithAuth() {
  const { login } = useAuth();
  const navigate = useNavigate();
  return <Login onLogin={(user, token) => { login(user, token); navigate('/feed'); }} />;
}

function App() {
  return (
    <AuthProvider>
      <ChatSocketProvider>
        <Router>
          <div className="app-container">
            <header className="app-header">
              <img src="/logo.svg" alt="Samvaad Logo" className="app-logo" />
              <h1 className="app-title">Samvaad</h1>
            </header>
            <AppNav />
            <AppRoutes />
          </div>
        </Router>
      </ChatSocketProvider>
    </AuthProvider>
  )
}

export default App
