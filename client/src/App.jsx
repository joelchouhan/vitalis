import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import NavBar from "./components/NavBar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Workouts from "./pages/Workouts.jsx";
import Diet from "./pages/Diet.jsx";
import Goals from "./pages/Goals.jsx";
import Social from "./pages/Social.jsx";
import Profile from "./pages/Profile.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-sm text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <NavBar />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/workouts"
          element={
            <Protected>
              <Workouts />
            </Protected>
          }
        />
        <Route
          path="/diet"
          element={
            <Protected>
              <Diet />
            </Protected>
          }
        />
        <Route
          path="/goals"
          element={
            <Protected>
              <Goals />
            </Protected>
          }
        />
        <Route
          path="/social"
          element={
            <Protected>
              <Social />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
      </Routes>
    </div>
  );
}
