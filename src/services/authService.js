import { ApiError, authApi } from "./apiClient.js";

export async function login(email, password) {
  const { data } = await authApi.post("/auth/login", {
    email: String(email).trim().toLowerCase(),
    password,
  });
  if (!data?.token) throw new ApiError("El servicio devolvió una respuesta de inicio de sesión inválida.");
  return data; // { token, expiresIn, user }
}

export async function register({ email, password, tenantId, employeeId }) {
  const body = { email: String(email).trim().toLowerCase(), password, tenantId };
  if (employeeId && employeeId.trim()) body.employeeId = employeeId.trim();
  const { data } = await authApi.post("/auth/register", body);
  return data; // { user }
}
