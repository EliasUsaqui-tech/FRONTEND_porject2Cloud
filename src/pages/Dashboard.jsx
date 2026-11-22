import { useCallback } from "react";
import { Module, Panel, Resource } from "@/components/Module";
import { useAuth } from "@/hooks/useAuth";
import { useResource } from "@/hooks/useResource";
import { CORE_WRITE_ROLES, RECRUITMENT_ROLES } from "@/lib/roles";
import { attendance, core, recruitment } from "@/services/hcmService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const employeeId = user.employeeId;
  const onboarding = useResource(useCallback((signal) =>
    core.employees({ status: "PENDING_ONBOARDING", limit: 1 }, signal), []), hasRole(...CORE_WRITE_ROLES) && "onboarding");
  const vacancies = useResource(useCallback((signal) =>
    recruitment.vacancies({ status: "OPEN", limit: 5 }, signal), []), hasRole(...RECRUITMENT_ROLES) && "vacancies");
  const history = useResource(useCallback((signal) =>
    attendance.history({ employeeId, limit: 1 }, signal), [employeeId]), employeeId);
  return (
    <Module title="Dashboard">
      <p className="text-muted-foreground">Bienvenido, {user.email}</p>
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
      <div className="grid gap-4 md:grid-cols-3">
        {hasRole(...CORE_WRITE_ROLES) && <Panel title="Onboarding pendiente">
          <Resource state={onboarding}>{(data) => <p>{data.pagination.total || "Sin empleados pendientes"}</p>}</Resource>
        </Panel>}
        {hasRole(...RECRUITMENT_ROLES) && <Panel title="Vacantes abiertas recientes">
          <Resource state={vacancies}>{(data) => data.items.length
            ? <ul className="list-inside list-disc text-sm">{data.items.map((item) => <li key={item.vacancyId}>{item.title}</li>)}</ul>
            : <p>Sin vacantes abiertas</p>}</Resource>
        </Panel>}
        <Panel title="Última asistencia">
          {!employeeId && <p className="text-sm text-muted-foreground">La cuenta no tiene un empleado vinculado.</p>}
          <Resource state={history}>{(data) => <p>{data.items[0]?.date || "Sin marcaciones"}</p>}</Resource>
        </Panel>
      </div>
    </Module>
  );
}
