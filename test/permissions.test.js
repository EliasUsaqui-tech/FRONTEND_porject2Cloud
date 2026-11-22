import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";

let vite;
let AuthContext;
let Layout;
let ProtectedRoute;
let Attendance;
let Payroll;
let Performance;
let Employees;
let recruitmentRoles;

before(async () => {
  globalThis.fetch = async () => assert.fail("Acceso de red inesperado");
  globalThis.document = { documentElement: { classList: { contains: () => true } } };
  vite = await createServer({
    envDir: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  const modules = await Promise.all([
    "/src/context/auth-context.js", "/src/components/Layout.jsx", "/src/components/ProtectedRoute.jsx",
    "/src/pages/Attendance.jsx", "/src/pages/Payroll.jsx", "/src/pages/Performance.jsx",
    "/src/pages/Employees.jsx", "/src/lib/roles.js",
  ].map((url) => vite.ssrLoadModule(url)));
  [
    { AuthContext }, { default: Layout }, { default: ProtectedRoute }, { default: Attendance },
    { default: Payroll }, { default: Performance }, { default: Employees }, { RECRUITMENT_ROLES: recruitmentRoles },
  ] = modules;
});

after(async () => {
  await vite?.close();
  delete globalThis.document;
});

function view(role, content) {
  const user = { role, tenantId: "tenant_a", employeeId: "emp-1", email: "empleado@example.test" };
  const value = { user, token: "mock", hasRole: (...roles) => roles.includes(role) };
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(AuthContext.Provider, { value }, content)));
}

test("menú y acceso directo aplican el mismo permiso de reclutamiento", () => {
  const directRoute = createElement(ProtectedRoute, { roles: recruitmentRoles }, createElement("p", null, "Contenido privado"));
  assert.match(view("HR", createElement(Layout)), /href="\/recruitment"/);
  assert.doesNotMatch(view("EMPLOYEE", createElement(Layout)), /href="\/recruitment"/);
  assert.match(view("HR", directRoute), /Contenido privado/);
  assert.doesNotMatch(view("EMPLOYEE", directRoute), /Contenido privado/);
});

test("botones administrativos respetan el rol y los empleados conservan el autoservicio", () => {
  assert.match(view("HR", createElement(Employees)), /Registrar empleado/);
  assert.match(view("HR", createElement(Payroll)), /Calcular nómina/);
  assert.match(view("ADMIN", createElement(Attendance)), /Eliminar marcación/);
  const personalAttendance = view("EMPLOYEE", createElement(Attendance));
  assert.match(personalAttendance, /Registrar entrada/);
  assert.match(personalAttendance, /Enviar solicitud/);
  assert.doesNotMatch(personalAttendance, /Aprobar permiso|Eliminar marcación/);
  const personalPayroll = view("EMPLOYEE", createElement(Payroll));
  assert.match(personalPayroll, /Boletas individuales/);
  assert.doesNotMatch(personalPayroll, /Calcular nómina|Consultar empleado/);
  assert.match(view("HR_MANAGER", createElement(Performance)), /Crear objetivo/);
  assert.doesNotMatch(view("EMPLOYEE", createElement(Performance)), /Crear objetivo/);
});
