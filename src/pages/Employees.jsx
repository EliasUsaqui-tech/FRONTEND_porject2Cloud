import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Action, Field, FileLink, Module, Pages, Panel, Resource, Rows } from "@/components/Module";
import { useAuth } from "@/hooks/useAuth";
import { useResource } from "@/hooks/useResource";
import { CORE_WRITE_ROLES, ROLES } from "@/lib/roles";
import { core } from "@/services/hcmService";
import { Button } from "@/components/ui/button";

const contractTypes = ["FULL_TIME", "PART_TIME", "CONTRACTOR"];
const loadDepartments = (signal) => core.departments(signal);

function EmploymentFields({ departments }) {
  return <>
    <Field label="Departamento" name="departmentId" required options={[
      { value: "", label: "Seleccionar" },
      ...departments.map((item) => ({ value: item.department_id, label: item.name })),
    ]} />
    <Field label="Salario" name="salary" required type="number" min="0.01" step="0.01" />
    <Field label="Fecha de ingreso" name="hireDate" type="date" required />
    <Field label="Tipo de contrato" name="contractType" options={contractTypes} />
  </>;
}

function PersonalFields({ employee }) {
  return <>
    <Field label="Nombres" name="firstName" defaultValue={employee?.first_name} required />
    <Field label="Apellidos" name="lastName" defaultValue={employee?.last_name} required />
    <Field label="Correo" name="email" type="email" defaultValue={employee?.email} required />
  </>;
}

function EmployeeDetail({ employee, departments, canWrite, reload }) {
  const { hasRole } = useAuth();
  const id = employee.employee_id;
  const [url, setUrl] = useState(null);
  const pending = employee.status === "PENDING_ONBOARDING";
  return <Panel title={`${employee.first_name} ${employee.last_name}`}>
    <p className="text-sm">{employee.email} · {employee.status} · {employee.department_name}</p>
    {employee.contract_id && <p className="text-sm">Contrato {employee.contract_type} · Salario {employee.salary}</p>}
    {(canWrite || hasRole(ROLES.EMPLOYEE)) && <Action label="Guardar datos" onSubmit={async ({ departmentId, ...values }) => {
      await core.editEmployee(id, { ...values, ...(departmentId && { departmentId }) });
      reload();
    }}>
      <PersonalFields employee={employee} />
      {canWrite && departments.length > 0 && <Field label="Departamento" name="departmentId" defaultValue={employee.department_id || ""}
        options={[{ value: "", label: "Seleccionar" }, ...departments.map((item) => ({ value: item.department_id, label: item.name }))]} />}
    </Action>}
    {canWrite && pending && <Action label="Completar onboarding" disabled={!departments.length} onSubmit={async ({ salary, ...values }) => {
      await core.onboard(id, { ...values, salary: Number(salary) });
      reload();
    }}><EmploymentFields departments={departments} /></Action>}
    {employee.contract_id && <>
      {canWrite && <Action label="Subir contrato" onSubmit={async ({ file }) => {
        await core.upload(id, file);
        setUrl(null);
      }}><Field label="Contrato PDF" name="file" type="file" accept="application/pdf" required /></Action>}
      <Action label="Obtener enlace del contrato" onSubmit={async () => setUrl((await core.contract(id)).downloadUrl)} />
      <FileLink url={url}>Abrir contrato</FileLink>
    </>}
  </Panel>;
}

export default function Employees() {
  const { user, hasRole } = useAuth();
  const canWrite = hasRole(...CORE_WRITE_ROLES);
  const [params] = useSearchParams();
  const [filter, setFilter] = useState(() => ({ page: 1, status: params.get("status") === "PENDING_ONBOARDING" ? "PENDING_ONBOARDING" : "" }));
  const [selected, setSelected] = useState(canWrite ? null : user.employeeId);
  const list = useResource(useCallback((signal) => core.employees(filter, signal), [filter]), canWrite && JSON.stringify(filter));
  const departments = useResource(loadDepartments, canWrite && "departments");
  const detail = useResource(useCallback((signal) => core.employee(selected, signal), [selected]), selected);
  const reload = () => { list.reload(); detail.reload(); };

  return <Module title="Empleados">
    {canWrite && <>
      <Panel title="Directorio">
        <Action label="Buscar" onSubmit={({ search, status }) => setFilter({ page: 1, search, status })}>
          <Field label="Nombre o correo" name="search" />
          <Field label="Estado" name="status" defaultValue={filter.status}
            options={[{ value: "", label: "Todos" }, "ACTIVE", "PENDING_ONBOARDING", "INACTIVE", "ON_LEAVE"]} />
        </Action>
        <Resource state={list}>{(data) => <>
          <Rows rows={data.items} id="employee_id" columns={[
            ["Empleado", (row) => <Button variant="link" onClick={() => setSelected(row.employee_id)}>{row.first_name} {row.last_name}</Button>],
            ["Correo", "email"], ["Departamento", "department_name"], ["Estado", "status"],
          ]} />
          <Pages data={data} page={filter.page} change={(page) => setFilter({ ...filter, page })} />
        </>}</Resource>
      </Panel>
      <Panel title="Departamentos">
        <Resource state={departments}>{(data) => <Rows rows={data} id="department_id" columns={[["Nombre", "name"], ["Presupuesto", "budget"]]} />}</Resource>
        <Action label="Crear departamento" onSubmit={async ({ name, budget }) => {
          await core.createDepartment({ name, budget: Number(budget) });
          departments.reload();
        }}>
          <Field label="Nombre" name="name" required />
          <Field label="Presupuesto" name="budget" type="number" min="0" step="0.01" required />
        </Action>
      </Panel>
      <Panel title="Registrar empleado">
        <Action label="Registrar" disabled={!departments.data?.length} onSubmit={async ({ salary, ...values }) => {
          const { employee } = await core.createEmployee({ ...values, salary: Number(salary) });
          setSelected(employee.employee_id);
          list.reload();
        }}>
          <PersonalFields />
          <EmploymentFields departments={departments.data || []} />
        </Action>
      </Panel>
    </>}
    {!canWrite && !selected && <p className="text-muted-foreground">La cuenta no tiene un empleado vinculado.</p>}
    <Resource state={detail}>{(employee) => <EmployeeDetail key={selected} employee={employee}
      departments={departments.data || []} canWrite={canWrite} reload={reload} />}</Resource>
  </Module>;
}
