import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import { Toaster } from "@/components/ui/sonner";

const Pending = ({ name }) => (
  <div className="text-muted-foreground">Módulo {name} (en implementación)</div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<Pending name="Empleados" />} />
            <Route path="/recruitment" element={<Pending name="Reclutamiento" />} />
            <Route path="/performance" element={<Pending name="Desempeño" />} />
            <Route path="/attendance" element={<Pending name="Asistencia" />} />
            <Route path="/payroll" element={<Pending name="Nómina" />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
