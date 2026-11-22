import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido, {user?.email}</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Tenant activo</CardTitle></CardHeader>
          <CardContent><Badge>{user?.tenantId}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Rol</CardTitle></CardHeader>
          <CardContent><Badge variant="secondary">{user?.role}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Employee ID</CardTitle></CardHeader>
          <CardContent><p className="text-sm font-mono truncate">{user?.employeeId ?? "—"}</p></CardContent>
        </Card>
      </div>
    </div>
  );
}