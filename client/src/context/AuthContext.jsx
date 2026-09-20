import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fittrack_token");
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("fittrack_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await client.post("/auth/login", { email, password });
    localStorage.setItem("fittrack_token", res.data.token);
    setUser(res.data.user);
  }

  async function register(name, email, password) {
    const res = await client.post("/auth/register", { name, email, password });
    localStorage.setItem("fittrack_token", res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem("fittrack_token");
    setUser(null);
  }

  async function refreshUser() {
    const res = await client.get("/auth/me");
    setUser(res.data);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
