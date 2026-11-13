import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const STORAGE_KEY = "hcm_auth";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const { token: t, user: u } = JSON.parse(raw);
        const decoded = jwtDecode(t);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(t);
          setUser(u);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persist = (t, u) => {
    setToken(t);
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
  };

  const login = async (email, password) => {
    const res = await fetch(`${import.meta.env.VITE_AUTH_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Credenciales inválidas");
    
    const d = jwtDecode(data.token);
    persist(data.token, {
      userId: d.sub,
      email: d.email,
      tenantId: d.tenantId,
      role: d.role,
      employeeId: d.employeeId,
    });
    return data;
  };

  const register = async (email, password, tenantId) => {
    const res = await fetch(`${import.meta.env.VITE_AUTH_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, tenantId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Error al registrar");
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);