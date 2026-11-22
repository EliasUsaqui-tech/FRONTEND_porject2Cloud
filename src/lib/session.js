import { jwtDecode } from "jwt-decode";

export const STORAGE_KEY = "hcm_auth";
export const SESSION_EXPIRED_EVENT = "hcm:session-expired";

export function buildSession(token, apiUser) {
  const claims = jwtDecode(token);
  if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now() || !claims.tenantId || !claims.role) {
    throw new Error("El token recibido no es válido");
  }
  return {
    token,
    expiresAt: claims.exp * 1000,
    user: {
      userId: claims.sub ?? apiUser?.userId ?? null,
      email: claims.email ?? apiUser?.email ?? null,
      tenantId: claims.tenantId, // el JWT es la única fuente del tenant
      role: String(claims.role).toUpperCase(),
      employeeId: claims.employeeId ?? null,
    },
  };
}

export function saveSession(token) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token }));
}

export function getStoredToken() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))?.token ?? null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function readSession() {
  try {
    const token = getStoredToken();
    return token ? buildSession(token) : null;
  } catch {
    clearSession();
    return null;
  }
}

export function getToken() {
  return readSession()?.token ?? null;
}

export function notifySessionExpired(message) {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message } }));
}
