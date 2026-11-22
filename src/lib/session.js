import { jwtDecode } from "jwt-decode";

export const STORAGE_KEY = "hcm_auth";
export const SESSION_EXPIRED_EVENT = "hcm:session-expired";

export function buildSession(token, apiUser) {
  const claims = jwtDecode(token);
  if (!claims.exp || !claims.tenantId || !claims.role) {
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

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { token } = JSON.parse(raw);
    const session = buildSession(token);
    if (session.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
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
