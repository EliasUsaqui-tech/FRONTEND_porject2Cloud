import { useCallback, useState } from "react";
import { Action, Field, FileLink, Module, Pages, Panel, Resource, Rows } from "@/components/Module";
import { useAuth } from "@/hooks/useAuth";
import { useResource } from "@/hooks/useResource";
import { CORE_WRITE_ROLES, PAYROLL_PERIOD_ROLES } from "@/lib/roles";
import { payroll } from "@/services/hcmService";

const amount = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n) => n == null ? "—" : amount.format(n);
const slipColumns = [
  ["Sueldo base", (row) => money(row.baseSalary)], ["Descuentos", (row) => money(row.deductions)],
  ["Sueldo neto", (row) => money(row.netPay)], ["Boleta", (row) => <FileLink url={row.downloadUrl}>PDF</FileLink>],
];

export default function Payroll() {
  const { user, hasRole } = useAuth();
  const canRead = hasRole(...PAYROLL_PERIOD_ROLES);
  const canCalculate = hasRole(...CORE_WRITE_ROLES);
  const canChoose = canRead || canCalculate;
  const [period, setPeriod] = useState({ value: "", page: 1 });
  const [individual, setIndividual] = useState({ value: user.employeeId, page: 1 });
  const periods = useResource(useCallback((signal) => payroll.period(period.value, period.page, signal), [period]),
    canRead && period.value && JSON.stringify(period));
  const slips = useResource(useCallback((signal) => payroll.individual(individual.value, individual.page, signal), [individual]),
    individual.value && JSON.stringify(individual));

  return <Module title="Nómina">
    {canCalculate && <Panel title="Calcular período">
      <Action label="Calcular nómina" onSubmit={async ({ month, pdfs }) => {
        const data = await payroll.calculate({ period: month, generatePdfs: pdfs === "on" });
        setPeriod({ value: month, page: 1 });
        periods.reload();
        slips.reload();
        return `${data.employeesProcessed} empleados · Neto ${money(data.totalNetPaid)} · ${data.pdfsGenerated} PDF`;
      }}>
        <Field label="Período" name="month" type="month" required />
        <label className="flex items-center gap-2 text-sm"><input name="pdfs" type="checkbox" /> Generar boletas PDF</label>
      </Action>
    </Panel>}
    {canRead && <Panel title="Consolidado">
      <Action label="Consultar período" onSubmit={({ month }) => setPeriod({ value: month, page: 1 })}>
        <Field label="Período" name="month" type="month" required />
      </Action>
      <Resource state={periods}>{(data) => <>
        <p className="text-sm">{data.period.periodName} · {data.summary.employeesCount} boletas · Base {money(data.summary.totalBaseSalary)} · Descuentos {money(data.summary.totalDeductions)} · Neto {money(data.summary.totalNetPay)}</p>
        <Rows rows={data.items} id="paySlipId" columns={[["Empleado", "employeeName"], ...slipColumns]} />
        <Pages data={data} page={period.page} change={(page) => setPeriod({ ...period, page })} />
      </>}</Resource>
    </Panel>}
    <Panel title="Boletas individuales">
      {canChoose && <Action label="Consultar empleado" onSubmit={({ employeeId }) => setIndividual({ value: employeeId.trim(), page: 1 })}>
        <Field label="ID del empleado" name="employeeId" defaultValue={individual.value || ""} required />
      </Action>}
      {!canChoose && !individual.value && <p className="text-muted-foreground">La cuenta no tiene un empleado vinculado.</p>}
      <Resource state={slips}>{(data) => <>
        <Rows rows={data.paySlips} id="paySlipId" columns={[["Período", "period"], ...slipColumns]} />
        <Pages data={data} page={individual.page} change={(page) => setIndividual({ ...individual, page })} />
      </>}</Resource>
    </Panel>
  </Module>;
}
