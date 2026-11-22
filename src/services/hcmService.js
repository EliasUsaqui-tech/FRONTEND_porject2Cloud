import {
  ApiError, attendanceApi, coreHrApi, payrollApi, performanceApi, recruitmentApi,
} from "./apiClient.js";

const id = encodeURIComponent;
const get = (api, path, params, signal) => api.get(path, { params, signal }).then(({ data }) => data);
const send = (api, method, url, data) => api.request({ method, url, data }).then((response) => response.data);
const employeePath = (employeeId) => `/employees/${id(employeeId)}`;
const candidatePath = (candidateId) => `/candidates/${id(candidateId)}`;

export const core = {
  departments: (signal) => get(coreHrApi, "/departments", null, signal),
  employees: (query, signal) => get(coreHrApi, "/employees", query, signal),
  employee: (employeeId, signal) => get(coreHrApi, employeePath(employeeId), null, signal),
  createDepartment: (body) => send(coreHrApi, "POST", "/departments", body),
  createEmployee: (body) => send(coreHrApi, "POST", "/employees", body),
  editEmployee: (employeeId, body) => send(coreHrApi, "PUT", employeePath(employeeId), body),
  onboard: (employeeId, body) => send(coreHrApi, "POST", `${employeePath(employeeId)}/complete-onboarding`, body),
  contract: (employeeId) => get(coreHrApi, `${employeePath(employeeId)}/contract-url`),
  async upload(employeeId, file) {
    if (file.type !== "application/pdf") throw new ApiError("Selecciona un contrato en PDF.");
    const { uploadUrl } = await send(coreHrApi, "POST", `${employeePath(employeeId)}/contract-upload-url`);
    await uploadFile(uploadUrl, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file });
  },
};

export const attendance = {
  remove: (employeeId, date) => send(attendanceApi, "DELETE", `/attendance/${id(employeeId)}/${id(date)}`),
  history: (query, signal) => get(attendanceApi, "/attendance", query, signal),
  clockIn: (body) => send(attendanceApi, "POST", "/attendance/clock-in", body),
  clockOut: (body) => send(attendanceApi, "POST", "/attendance/clock-out", body),
  requestLeave: (body) => send(attendanceApi, "POST", "/leaves/request", body),
  approve: (leaveId, body) => send(attendanceApi, "POST", `/leaves/${id(leaveId)}/approve`, body),
};

export const payroll = {
  period: (period, page, signal) => get(payrollApi, `/payrolls/${id(period)}`, { page }, signal),
  individual: (employeeId, page, signal) => get(payrollApi, `/payrolls/employee/${id(employeeId)}`, { page }, signal),
  calculate: (body) => send(payrollApi, "POST", "/payrolls/calculate", body),
};

export const recruitment = {
  vacancies: (query, signal) => get(recruitmentApi, "/vacancies", query, signal),
  createVacancy: (body) => send(recruitmentApi, "POST", "/vacancies", body),
  editVacancy: (vacancyId, body) => send(recruitmentApi, "PATCH", `/vacancies/${id(vacancyId)}`, body),
  candidates: (query, signal) => get(recruitmentApi, "/candidates", query, signal),
  candidate: (candidateId, signal) => get(recruitmentApi, candidatePath(candidateId), null, signal),
  createCandidate: (body) => send(recruitmentApi, "POST", "/candidates", body),
  submit: (candidateId) => send(recruitmentApi, "POST", `${candidatePath(candidateId)}/submit`),
  stage: (candidateId, body) => send(recruitmentApi, "PATCH", `${candidatePath(candidateId)}/stage`, body),
  document: (candidateId, key) => get(recruitmentApi, `${candidatePath(candidateId)}/documents/${id(key)}`),
  async upload(candidateId, key, file) {
    const types = key === "resume" ? ["application/pdf"] : ["application/pdf", "image/jpeg", "image/png"];
    if (!types.includes(file.type)) throw new ApiError("El formato de archivo no está permitido.");
    if (file.size > 5 * 1024 * 1024) throw new ApiError("El archivo supera los 5 MB.");
    const part = key === "resume" ? "resume" : `certificates/${id(key)}`;
    const { uploadUrl, fields, maxBytes } = await send(recruitmentApi, "POST", `${candidatePath(candidateId)}/${part}/upload-url`,
      { contentType: file.type });
    if (file.size > maxBytes) throw new ApiError("El archivo supera el tamaño permitido.");
    const body = new FormData();
    Object.entries(fields).forEach(([name, value]) => body.append(name, value));
    body.append("file", file);
    await uploadFile(uploadUrl, { method: "POST", body });
  },
};

export const performance = {
  employee: (employeeId, query, signal) => get(performanceApi, `/evaluations/employee/${id(employeeId)}`, query, signal),
  createGoal: (body) => send(performanceApi, "POST", "/goals", body),
  editGoal: (employeeId, goalId, body) => send(performanceApi, "PATCH", `/goals/${id(employeeId)}/${id(goalId)}`, body),
  evaluate: (body) => send(performanceApi, "POST", "/evaluations", body),
};

async function uploadFile(url, options) {
  if (!/^https:\/\//i.test(url)) throw new ApiError("El servicio no devolvió una URL de carga válida.");
  const response = await fetch(url, { ...options, credentials: "omit", redirect: "error" });
  if (!response.ok) throw new ApiError("No se pudo guardar el archivo.", { status: response.status });
}
