import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Recruitment from "@/pages/Recruitment";
import Performance from "@/pages/Performance";
import Attendance from "@/pages/Attendance";
import Payroll from "@/pages/Payroll";
import { CORE_READ_ROLES, RECRUITMENT_ROLES } from "@/lib/roles";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<ProtectedRoute roles={CORE_READ_ROLES}><Employees /></ProtectedRoute>} />
            <Route path="/recruitment" element={<ProtectedRoute roles={RECRUITMENT_ROLES}><Recruitment /></ProtectedRoute>} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/payroll" element={<Payroll />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
