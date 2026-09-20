import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/workouts", label: "Workouts" },
  { to: "/diet", label: "Diet" },
  { to: "/goals", label: "Goals" },
  { to: "/social", label: "Social" },
  { to: "/profile", label: "Profile" },
];

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <span className="font-bold text-brand-600 text-lg">FitTrack</span>
        <div className="hidden md:flex gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 hidden sm:inline">Hi, {user?.name}</span>
        <button
          onClick={logout}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
