import axios from "axios";

const STORAGE_KEY = "hcm_auth";

export function createApiClient(baseURL) {
  const api = axios.create({ baseURL });

  api.interceptors.request.use((config) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      config.headers.Authorization = `Bearer ${JSON.parse(raw).token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (r) => r,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(STORAGE_KEY);
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );
  return api;
}

export const coreHrApi = createApiClient(import.meta.env.VITE_CORE_HR_API_URL);
export const recruitmentApi = createApiClient(import.meta.env.VITE_RECRUITMENT_API_URL);
export const performanceApi = createApiClient(import.meta.env.VITE_PERFORMANCE_API_URL);
export const attendanceApi = createApiClient(import.meta.env.VITE_ATTENDANCE_API_URL);
export const payrollApi = createApiClient(import.meta.env.VITE_PAYROLL_API_URL);