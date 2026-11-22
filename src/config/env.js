const clean = (v) => (v ? String(v).trim().replace(/\/+$/, "") : "");
const nodeEnv = globalThis.process?.versions?.node ? globalThis.process.env : null;

export const API_URLS = {
  auth: clean(nodeEnv ? nodeEnv.VITE_AUTH_API_URL : import.meta.env.VITE_AUTH_API_URL),
  coreHr: clean(nodeEnv ? nodeEnv.VITE_CORE_HR_API_URL : import.meta.env.VITE_CORE_HR_API_URL),
  recruitment: clean(nodeEnv ? nodeEnv.VITE_RECRUITMENT_API_URL : import.meta.env.VITE_RECRUITMENT_API_URL),
  performance: clean(nodeEnv ? nodeEnv.VITE_PERFORMANCE_API_URL : import.meta.env.VITE_PERFORMANCE_API_URL),
  attendance: clean(nodeEnv ? nodeEnv.VITE_ATTENDANCE_API_URL : import.meta.env.VITE_ATTENDANCE_API_URL),
  payroll: clean(nodeEnv ? nodeEnv.VITE_PAYROLL_API_URL : import.meta.env.VITE_PAYROLL_API_URL),
};

export const TENANTS = ((nodeEnv ? nodeEnv.VITE_TENANTS : import.meta.env.VITE_TENANTS) || "tenant_a,tenant_b,tenant_c")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);

export const missingApiUrls = Object.entries(API_URLS)
  .filter(([, v]) => !v || v.includes("placeholder"))
  .map(([k]) => k);
