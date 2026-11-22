import axios from "axios";
import { API_URLS } from "@/config/env";
import { getToken, clearSession, notifySessionExpired } from "@/lib/session";

export class ApiError extends Error {
  constructor(message, { status = 0, details = null, isNetworkError = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.isNetworkError = isNetworkError;
  }
}

const GENERIC_GATEWAY = /^(forbidden|unauthorized|missing authentication token|user is not authorized.*)$/i;

const DEFAULTS = {
  400: "La solicitud no es válida.",
  401: "Tu sesión no es válida o expiró. Inicia sesión nuevamente.",
  403: "No tienes permisos para realizar esta acción.",
  404: "No se encontró el recurso solicitado.",
  409: "La operación entra en conflicto con el estado actual.",
  422: "No se pudo procesar la solicitud.",
  429: "Demasiadas solicitudes. Intenta nuevamente en unos segundos.",
  503: "El servicio está ocupado. Intenta nuevamente.",
};

export function toApiError(error) {
  if (error instanceof ApiError) return error;

  if (error?.response) {
    const { status, data } = error.response;
    const raw =
      typeof data === "string"
        ? data
        : data?.message || data?.error || (Array.isArray(data?.errors) ? data.errors.join(", ") : "");
    const useBackend = raw && !GENERIC_GATEWAY.test(String(raw).trim());
    const message = useBackend
      ? String(raw)
      : DEFAULTS[status] || (status >= 500 ? "Error interno del servidor. Intenta nuevamente." : "Ocurrió un error inesperado.");
    return new ApiError(message, { status, details: typeof data === "object" ? data : null });
  }

  if (error?.code === "ECONNABORTED") {
    return new ApiError("El servidor tardó demasiado en responder. Intenta nuevamente.", { isNetworkError: true });
  }
  return new ApiError("No se pudo conectar con el servidor. Revisa tu conexión.", { isNetworkError: true });
}

export const getErrorMessage = (err) => toApiError(err).message;

export function createApiClient(baseURL, { name = "API", auth = true } = {}) {
  const api = axios.create({ baseURL, timeout: 30000 });

  api.interceptors.request.use((config) => {
    if (!baseURL) {
      return Promise.reject(new ApiError(`La URL del servicio ${name} no está configurada (VITE_*).`));
    }
    if (auth) {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const apiError = toApiError(error);
      // Solo el authorizer de API Gateway (mensaje "Unauthorized") invalida la sesión.
      // Un 401 propio de un microservicio no debe expulsar al usuario.
      const fromAuthorizer =
        error?.response?.status === 401 && String(error.response?.data?.message || "").trim() === "Unauthorized";
      if (auth && fromAuthorizer) {
        clearSession();
        notifySessionExpired("Tu sesión expiró. Inicia sesión nuevamente.");
      }
      return Promise.reject(apiError);
    }
  );
  return api;
}

export const authApi = createApiClient(API_URLS.auth, { name: "Auth", auth: false });
export const coreHrApi = createApiClient(API_URLS.coreHr, { name: "Core HR" });
export const recruitmentApi = createApiClient(API_URLS.recruitment, { name: "Recruitment" });
export const performanceApi = createApiClient(API_URLS.performance, { name: "Performance" });
export const attendanceApi = createApiClient(API_URLS.attendance, { name: "Attendance" });
export const payrollApi = createApiClient(API_URLS.payroll, { name: "Payroll" });
