import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CORE_READ_ROLES, RECRUITMENT_ROLES, hasAnyRole } from "@/lib/roles";
import { 
  Building2, LayoutDashboard, Users, Briefcase, Gauge, Clock, Wallet, LogOut, Sun, Moon 
} from "lucide-react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Empleados", icon: Users, roles: CORE_READ_ROLES },
  { to: "/recruitment", label: "Reclutamiento", icon: Briefcase, roles: RECRUITMENT_ROLES },
  { to: "/performance", label: "Desempeño", icon: Gauge },
  { to: "/attendance", label: "Asistencia", icon: Clock },
  { to: "/payroll", label: "Nómina", icon: Wallet },
];

export default function Layout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  
  // Estado para saber si está en modo oscuro
  const [isDark, setIsDark] = useState(() => 
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    // Agregamos bg-background y text-foreground para que el modo oscuro aplique a todo
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card dark:bg-slate-900 dark:border-slate-800 flex flex-col transition-colors duration-300">
        <div className="h-16 flex items-center gap-2 px-5 font-semibold border-b dark:border-slate-800">
          <Building2 className="h-5 w-5 text-primary" /> HCM Cloud
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          {nav.filter(({ roles }) => hasAnyRole(user, roles)).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted dark:hover:bg-slate-800"
                }`
              }>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        
        <Separator className="dark:bg-slate-800" />
        
        <div className="p-4">
          <p className="text-sm font-medium truncate">{user?.email}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{user?.tenantId}</Badge>
            <Badge variant="outline">{user?.role}</Badge>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => { logout(); navigate("/login"); }}>
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="min-w-0 flex-1 bg-muted/30 dark:bg-slate-950 p-8 relative transition-colors duration-300">
        
        {/* Botón flotante para cambiar el tema (Ahora en el Dashboard) */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors shadow-sm"
          title="Cambiar tema"
          type="button"
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          )}
        </button>

        {/* Aquí se renderizan las páginas (Dashboard, Employees, etc.) */}
        <Outlet key={token} />
        
      </main>
    </div>
  );
}
