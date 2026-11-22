import { useCallback, useState } from "react";
import { Action, Field, Module, Pages, Panel, Resource, Rows } from "@/components/Module";
import { useAuth } from "@/hooks/useAuth";
import { useResource } from "@/hooks/useResource";
import { HR_ROLES } from "@/lib/roles";
import { attendance } from "@/services/hcmService";

export default function Attendance() {
  const { user, hasRole } = useAuth();
  const privileged = hasRole(...HR_ROLES);
  const [employeeId, setEmployeeId] = useState(user.employeeId || "");
  const [dates, setDates] = useState({});
  const [tokens, setTokens] = useState([null]);
  const page = tokens.length;
  const nextToken = tokens.at(-1);
  const load = useCallback((signal) => attendance.history({ employeeId, ...dates, nextToken }, signal), [employeeId, dates, nextToken]);
  const history = useResource(load, employeeId && JSON.stringify([employeeId, dates, nextToken]));
  const [leaveId, setLeaveId] = useState("");
  const canDelete = hasRole("ADMIN");
  return <Module title="Asistencia">
    {privileged && <Panel title="Empleado">
      <Action label="Seleccionar" onSubmit={(values) => {
        setEmployeeId(values.employeeId.trim());
        setTokens([null]);
      }}><Field label="ID del empleado" name="employeeId" defaultValue={employeeId} required /></Action>
    </Panel>}
    {!employeeId && <p className="text-muted-foreground">Se requiere un empleado para registrar asistencia.</p>}
    {employeeId && <>
      <Panel title="Marcaciones">
        <Action key={`in-${employeeId}`} label="Registrar entrada" onSubmit={async () => {
          await attendance.clockIn({ employeeId });
          history.reload();
        }} />
        <Action key={`out-${employeeId}`} label="Registrar salida" onSubmit={async ({ date }) => {
          await attendance.clockOut({ employeeId, ...(date && { date }) });
          history.reload();
        }}><Field label="Fecha de entrada (turno nocturno)" name="date" type="date" /></Action>
      </Panel>
      <Panel title="Historial">
        <Action label="Filtrar" onSubmit={({ from, to }) => {
          setDates({ from: from || undefined, to: to || undefined });
          setTokens([null]);
        }}>
          <Field label="Desde" name="from" type="date" />
          <Field label="Hasta" name="to" type="date" />
        </Action>
        <Resource state={history}>{(data) => <>
          <Rows rows={data.items} id="date" columns={[["Fecha", "date"], ["Entrada", "clockIn"], ["Salida", "clockOut"], ["Minutos", "workedMinutes"]]} />
          <Pages data={data} page={page} change={(n, token) => setTokens(n < page ? tokens.slice(0, n) : [...tokens, token])} />
        </>}</Resource>
        {canDelete && <Action label="Eliminar marcación" onSubmit={async ({ date }) => {
          if (!window.confirm(`¿Eliminar la marcación del ${date} para ${employeeId}?`)) return "Eliminación cancelada.";
          await attendance.remove(employeeId, date);
          history.reload();
        }}><Field label="Fecha de la marcación" name="date" type="date" required /></Action>}
      </Panel>
      <Panel title="Solicitar permiso">
        <Action key={employeeId} label="Enviar solicitud" onSubmit={async (values) => {
          const { leave } = await attendance.requestLeave({ ...values, employeeId });
          if (privileged) setLeaveId(leave.leaveId);
          return `Solicitud ${leave.leaveId} · ${leave.status}`;
        }}>
          <Field label="Tipo" name="type" options={["VACATION", "SICK", "UNPAID", "OTHER"]} />
          <Field label="Inicio" name="startDate" type="date" required />
          <Field label="Fin" name="endDate" type="date" required />
          <Field label="Motivo" name="reason" />
        </Action>
      </Panel>
    </>}
    {privileged && <Panel title="Aprobar permiso">
      <Action label="Aprobar" onSubmit={async ({ leaveId: id, note }) => {
        const data = await attendance.approve(id.trim(), { note });
        return `${data.leave.status} · Notificación ${data.notification}`;
      }}>
        <Field label="ID del permiso" name="leaveId" value={leaveId} onChange={(event) => setLeaveId(event.target.value)} required />
        <Field label="Nota" name="note" />
      </Action>
    </Panel>}
  </Module>;
}
