import { useCallback, useState } from "react";
import { Action, Field, Module, Panel, Resource, Rows } from "@/components/Module";
import { useAuth } from "@/hooks/useAuth";
import { useResource } from "@/hooks/useResource";
import { PERFORMANCE_MANAGE_ROLES } from "@/lib/roles";
import { performance } from "@/services/hcmService";

const cyclePattern = "[0-9]{4}-(Q[1-4]|H[12]|ANUAL)";

function EmployeeFields({ employeeId }) {
  return <>
    <Field label="ID del empleado" name="employeeId" defaultValue={employeeId || ""} required />
    <Field label="Nombre del empleado" name="employeeName" required />
    <Field label="Correo del empleado" name="employeeEmail" type="email" required />
  </>;
}

export default function Performance() {
  const { user, hasRole } = useAuth();
  const canManage = hasRole(...PERFORMANCE_MANAGE_ROLES);
  const [query, setQuery] = useState({ employeeId: user.employeeId, cycle: "", compareWith: "" });
  const load = useCallback((signal) => performance.employee(query.employeeId, {
    cycle: query.cycle || undefined, compareWith: query.compareWith || undefined,
  }, signal), [query]);
  const result = useResource(load, query.employeeId && JSON.stringify(query));

  return <Module title="Desempeño">
    <Panel title="Resultados">
      {(canManage || user.employeeId) && <Action label="Consultar" onSubmit={({ employeeId, ...values }) =>
        setQuery({ ...values, employeeId: canManage ? employeeId.trim() : user.employeeId })}>
        {canManage && <Field label="ID del empleado" name="employeeId" required defaultValue={query.employeeId || ""} />}
        <Field label="Ciclo" name="cycle" pattern={cyclePattern} placeholder="2026-Q4" />
        <Field label="Comparar con" name="compareWith" pattern={cyclePattern} placeholder="2026-Q3" />
      </Action>}
      {!canManage && !user.employeeId && <p className="text-muted-foreground">La cuenta no tiene un empleado vinculado.</p>}
      <Resource state={result}>{(data) => <>
        {data.overall?.current != null && <p className="text-sm">
          Resultado {data.overall.current}/5 · Anterior {data.overall.previous ?? "—"} · {data.overall.status}
        </p>}
        {data.insights?.messages?.map((message) => <p key={message} className="text-sm">{message}</p>)}
        <Rows rows={data.trend} id="cycle" columns={[["Ciclo", "cycle"], ["Promedio", "average"]]} />
        <Rows rows={data.competencies} id="name" columns={[["Competencia", "name"], ["Actual", "current"], ["Anterior", "previous"], ["Estado", "status"]]} />
        <Rows rows={data.evaluations} id="evalId" columns={[
          ["Evaluador", "evaluatorName"], ["Relación", "relationship"], ["Puntaje", "score"], ["Fortalezas", "strengths"], ["Mejoras", "improvements"],
        ]} />
      </>}</Resource>
    </Panel>
    <Panel title="Objetivos">
      <Resource state={result}>{(data) => <Rows rows={data.goals?.items} id="goalId" columns={[
        ["Objetivo", "title"], ["Fecha límite", "targetDate"], ["Avance (%)", "progress"], ["Estado", "status"],
        ["Actualizar", (goal) => <Action label="Guardar" onSubmit={async ({ progress, status }) => {
          await performance.editGoal(query.employeeId, goal.goalId, { progress: Number(progress), ...(status && { status }) });
          result.reload();
        }}>
          <Field label="Avance (%)" name="progress" type="number" min="0" max="100" defaultValue={goal.progress} required />
          {canManage && <Field label="Estado" name="status" options={[{ value: "", label: "Mantener" }, "ACTIVE", "COMPLETED", "CANCELLED"]} />}
        </Action>],
      ]} />}</Resource>
      {canManage && <Action label="Crear objetivo" onSubmit={async (values) => {
        await performance.createGoal(values);
        setQuery({ ...query, employeeId: values.employeeId });
        result.reload();
      }}>
        <EmployeeFields employeeId={query.employeeId} />
        <Field name="title" label="Título" required />
        <Field name="description" label="Descripción" />
        <Field name="targetDate" label="Fecha límite" type="date" required />
      </Action>}
    </Panel>
    {(user.employeeId || canManage) && <Panel title="Evaluación 360°">
      <Action label="Registrar evaluación" onSubmit={async ({ score, competency, comment, anonymous, ...values }) => {
        const evaluatorId = user.employeeId || values.evaluatorId;
        await performance.evaluate({
          ...values, evaluatorId, score: Number(score), anonymous: anonymous === "on",
          ...(competency && { competencies: [{ name: competency, score: Number(score), ...(comment && { comment }) }] }),
        });
        if (query.employeeId === values.employeeId) result.reload();
      }}>
        <EmployeeFields employeeId={query.employeeId} />
        {!user.employeeId && <Field label="ID del evaluador" name="evaluatorId" required />}
        <Field label="Nombre del evaluador" name="evaluatorName" required />
        <Field label="Relación" name="relationship" options={["SELF", "MANAGER", "PEER", "DIRECT_REPORT"]} />
        <Field label="Ciclo" name="cycle" pattern={cyclePattern} placeholder="2026-Q4" required />
        <Field label="Puntaje" name="score" type="number" min="1" max="5" step="0.5" required />
        <Field label="Competencia" name="competency" />
        <Field label="Comentario de la competencia" name="comment" />
        <Field label="Fortalezas" name="strengths" />
        <Field label="Mejoras" name="improvements" />
        <label className="flex items-center gap-2 text-sm"><input name="anonymous" type="checkbox" /> Anónima (solo PEER)</label>
      </Action>
    </Panel>}
  </Module>;
}
