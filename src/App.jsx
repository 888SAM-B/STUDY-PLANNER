import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreatePlan from './pages/CreatePlan';
import RoadmapDetails from './pages/RoadmapDetails';
import Assessment from './pages/Assessment';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE"; // Set in frontend/.env

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/create-plan" element={
              <PrivateRoute>
                <CreatePlan />
              </PrivateRoute>
            } />
            <Route path="/roadmap/:id" element={
              <PrivateRoute>
                <RoadmapDetails />
              </PrivateRoute>
            } />
            <Route path="/assessment/:id" element={
              <PrivateRoute>
                <Assessment />
              </PrivateRoute>
            } />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            theme="dark"
          />
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
