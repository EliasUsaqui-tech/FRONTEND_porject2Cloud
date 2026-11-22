import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { beforeEach, mock, test } from "node:test";
import { AxiosError } from "axios";
import { CORE_WRITE_ROLES, HR_ROLES, PAYROLL_PERIOD_ROLES, RECRUITMENT_ROLES, hasAnyRole } from "../src/lib/roles.js";

const services = ["AUTH", "CORE_HR", "ATTENDANCE", "PAYROLL", "RECRUITMENT", "PERFORMANCE"];
for (const service of services) process.env[`VITE_${service}_API_URL`] = `https://${service.toLowerCase().replace("_", "-")}.invalid/dev`;

const { authApi, coreHrApi, attendanceApi, payrollApi, recruitmentApi, performanceApi, createApiClient } =
  await import("../src/services/apiClient.js");
const { login, register } = await import("../src/services/authService.js");
const { core, attendance, payroll, recruitment, performance } = await import("../src/services/hcmService.js");
const { buildSession, getToken, saveSession } = await import("../src/lib/session.js");

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
globalThis.window = new EventTarget();
globalThis.fetch = async () => assert.fail("Acceso de red inesperado");

const clients = [authApi, coreHrApi, attendanceApi, payrollApi, recruitmentApi, performanceApi];
const jwt = (overrides = {}) => {
  const payload = { sub: "user-1", email: "empleado@example.test", tenantId: "tenant_a", role: "EMPLOYEE",
    employeeId: "emp-1", exp: Math.floor(Date.now() / 1000) + 600, ...overrides };
  return `e30.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.mock`;
};
const mocked = (api, { method, url, body, params, response, token }) => {
  api.defaults.adapter = async (config) => {
    assert.match(config.baseURL, /\.invalid\/dev$/);
    assert.equal(config.method, method);
    assert.equal(config.url, url);
    assert.deepEqual(config.params ?? undefined, params);
    assert.deepEqual(config.data === undefined ? undefined : JSON.parse(config.data), body);
    assert.equal(config.headers.Authorization, token ? `Bearer ${token}` : undefined);
    return { config, status: 200, data: response };
  };
};

beforeEach(() => {
  storage.clear();
  for (const api of clients) api.defaults.adapter = async () => assert.fail("Solicitud sin mock");
});

test("login y registro sin JWT y con el cuerpo del contrato", async () => {
  const token = jwt();
  mocked(authApi, { method: "post", url: "/auth/login", body: { email: "a@example.test", password: "secret123" }, response: { token } });
  assert.equal((await login(" A@EXAMPLE.TEST ", "secret123")).token, token);
  mocked(authApi, { method: "post", url: "/auth/register",
    body: { email: "a@example.test", password: "secret123", tenantId: "tenant_a", employeeId: "emp-1" }, response: { user: {} } });
  assert.deepEqual(await register({ email: "a@example.test", password: "secret123", tenantId: "tenant_a", employeeId: " emp-1 " }), { user: {} });
});

test("sesión vencida bloqueada y tenant tomado del JWT", async () => {
  assert.equal(buildSession(jwt(), { tenantId: "tenant_b" }).user.tenantId, "tenant_a");
  saveSession(jwt({ exp: 1 }));
  assert.equal(getToken(), null);
  await assert.rejects(core.departments(), { status: 401 });
  await assert.rejects(coreHrApi.get("https://otro.invalid"), /Ruta de API inválida/);
});

test("400, 401, 403 y 409 se propagan y un 401 anterior no borra otra sesión", async () => {
  for (const status of [400, 401, 403, 409]) {
    const token = jwt();
    saveSession(token);
    const message = status === 401 ? "Unauthorized" : "Error del servicio";
    const adapter = async (config) => {
      if (status === 401) saveSession(jwt({ tenantId: "tenant_b" }));
      throw new AxiosError("mock", undefined, config, null, { status, data: { message } });
    };
    const client = createApiClient("https://mock.invalid", { adapter });
    await assert.rejects(client.get("/employees"), { status });
    assert.equal(buildSession(getToken()).user.tenantId, status === 401 ? "tenant_b" : "tenant_a");
  }
});

test("401 del authorizer cierra la sesión que originó la solicitud", async () => {
  saveSession(jwt());
  let expired = false;
  window.addEventListener("hcm:session-expired", () => { expired = true; }, { once: true });
  const adapter = async (config) => {
    throw new AxiosError("mock", undefined, config, null, { status: 401, data: { message: "Unauthorized" } });
  };
  await assert.rejects(createApiClient("https://mock.invalid", { adapter }).get("/employees"), { status: 401 });
  assert.equal(getToken(), null);
  assert.equal(expired, true);
});

test("una respuesta exitosa de una sesión anterior queda descartada", async () => {
  const token = jwt();
  const other = jwt({ tenantId: "tenant_b" });
  saveSession(token);
  const adapter = async (config) => {
    assert.equal(config.headers.Authorization, `Bearer ${token}`);
    saveSession(other);
    return { config, status: 200, data: { items: [{ id: "solo-tenant-a" }] } };
  };
  await assert.rejects(createApiClient("https://mock.invalid", { adapter }).get("/employees"), { status: 401 });
  assert.equal(getToken(), other);
});

test("HR puede gestionar Core HR y EMPLOYEE queda fuera de operaciones administrativas", () => {
  assert.equal(hasAnyRole({ role: "HR" }, CORE_WRITE_ROLES), true);
  assert.equal(hasAnyRole({ role: "MANAGER" }, PAYROLL_PERIOD_ROLES), true);
  assert.equal(hasAnyRole({ role: "MANAGER" }, CORE_WRITE_ROLES), false);
  for (const roles of [CORE_WRITE_ROLES, HR_ROLES, RECRUITMENT_ROLES, PAYROLL_PERIOD_ROLES]) {
    assert.equal(hasAnyRole({ role: "EMPLOYEE" }, roles), false);
  }
});

test("las seis VITE_* apuntan a los servicios acordados y el ejemplo no declara credenciales", async () => {
  const example = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  const entries = Object.fromEntries(example.split("\n").filter((line) => line.startsWith("VITE_")).map((line) => line.split("=")));
  const expected = ["0kcyrpixu6", "ux8kpfgl43", "ufhtrhk10j", "1dv0evo8z0", "1fh59dk4w6", "g9bgpetw4m"];
  services.forEach((service, index) => assert.equal(entries[`VITE_${service}_API_URL`],
    `https://${expected[index]}.execute-api.us-east-1.amazonaws.com/dev`));
  assert.deepEqual(Object.keys(entries).sort(), [...services.map((service) => `VITE_${service}_API_URL`), "VITE_TENANTS"].sort());
});

test("formularios administrativos y consultas envían campos, filtros y paginación del contrato", async () => {
  const token = jwt({ role: "HR" });
  saveSession(token);
  const department = { name: "Operaciones", budget: 0 };
  const history = { employeeId: "emp-1", from: "2026-11-01", nextToken: "cursor-mock" };
  const cycles = { cycle: "2026-Q4", compareWith: "2026-Q3" };
  const cases = [
    [coreHrApi, { method: "post", url: "/departments", body: department }, () => core.createDepartment(department)],
    [attendanceApi, { method: "get", url: "/attendance", params: history }, () => attendance.history(history)],
    [attendanceApi, { method: "post", url: "/leaves/leave-1/approve", body: { note: "OK" } }, () => attendance.approve("leave-1", { note: "OK" })],
    [payrollApi, { method: "get", url: "/payrolls/employee/emp-1", params: { page: 2 } }, () => payroll.individual("emp-1", 2)],
    [recruitmentApi, { method: "patch", url: "/candidates/c-1/stage", body: { stage: "HIRED" } }, () => recruitment.stage("c-1", { stage: "HIRED" })],
    [performanceApi, { method: "get", url: "/evaluations/employee/emp-1", params: cycles }, () => performance.employee("emp-1", cycles)],
  ];
  for (const [api, request, execute] of cases) {
    mocked(api, { ...request, token, response: { ok: true } });
    assert.deepEqual(await execute(), { ok: true });
  }
});

test("contrato firmado se sube con PUT PDF sin credenciales", async (context) => {
  const token = jwt({ role: "HR" });
  saveSession(token);
  const uploadUrl = "https://storage.invalid/contract";
  const file = new File(["test"], "contract.pdf", { type: "application/pdf" });
  mocked(coreHrApi, { method: "post", url: "/employees/emp-1/contract-upload-url", token, response: { uploadUrl } });
  const fetchMock = context.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, uploadUrl);
    assert.equal(options.method, "PUT");
    assert.equal(options.headers["Content-Type"], "application/pdf");
    assert.equal(options.credentials, "omit");
    assert.equal(options.body, file);
    return { ok: true };
  });
  await core.upload("emp-1", file);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("Core HR, Attendance, Payroll y Performance usan rutas y carga útiles verificadas", async () => {
  const token = jwt({ role: "ADMIN" });
  saveSession(token);
  const employment = { departmentId: "dep-1", salary: 2500, hireDate: "2026-11-15", contractType: "FULL_TIME" };
  const cases = [
    [coreHrApi, "post", "/employees/emp-1/complete-onboarding", employment, () => core.onboard("emp-1", employment)],
    [attendanceApi, "delete", "/attendance/emp-1/2026-11-15", undefined, () => attendance.remove("emp-1", "2026-11-15")],
    [payrollApi, "post", "/payrolls/calculate", { period: "2026-11", generatePdfs: false },
      () => payroll.calculate({ period: "2026-11", generatePdfs: false })],
    [performanceApi, "patch", "/goals/emp-1/goal-1", { progress: 60 }, () => performance.editGoal("emp-1", "goal-1", { progress: 60 })],
  ];
  for (const [api, method, url, body, execute] of cases) {
    mocked(api, { method, url, body, token, response: { ok: true } });
    assert.deepEqual(await execute(), { ok: true });
  }
});

test("CV firmado usa POST multipart sin credenciales y archivo al final", async (context) => {
  const token = jwt({ role: "ADMIN" });
  saveSession(token);
  const uploadUrl = "https://storage.invalid/upload";
  mocked(recruitmentApi, { method: "post", url: "/candidates/c-1/resume/upload-url", token,
    body: { contentType: "application/pdf" }, response: { uploadUrl, fields: { key: "tenant_a/test.pdf", policy: "mock" } } });
  const fetchMock = context.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, uploadUrl);
    assert.equal(options.method, "POST");
    assert.equal(options.credentials, "omit");
    assert.equal(options.headers, undefined);
    assert.deepEqual([...options.body.keys()], ["key", "policy", "file"]);
    assert.equal(options.body.get("file").name, "cv.pdf");
    return { ok: true };
  });
  await recruitment.upload("c-1", "resume", new File(["test"], "cv.pdf", { type: "application/pdf" }));
  assert.equal(fetchMock.mock.callCount(), 1);
});

test.after(() => mock.restoreAll());
