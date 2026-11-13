import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-muted-foreground flex items-center justify-center h-screen">Cargando sesión…</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<div className="text-muted-foreground">Módulo Empleados (Próximamente)</div>} />
            <Route path="/recruitment" element={<div className="text-muted-foreground">Módulo Reclutamiento (Próximamente)</div>} />
            <Route path="/performance" element={<div className="text-muted-foreground">Módulo Desempeño (Próximamente)</div>} />
            <Route path="/attendance" element={<div className="text-muted-foreground">Módulo Asistencia (Próximamente)</div>} />
            <Route path="/payroll" element={<div className="text-muted-foreground">Módulo Nómina (Próximamente)</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}