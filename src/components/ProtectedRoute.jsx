import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Forbidden from "@/components/Forbidden";

// <ProtectedRoute>…</ProtectedRoute> exige sesión; con roles={[…]} exige además uno de esos roles.
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles?.length && !roles.includes(user.role)) return <Forbidden />;
  return children ?? <Outlet />;
}
