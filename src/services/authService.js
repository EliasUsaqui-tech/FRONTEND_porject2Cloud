import { authApi } from "./apiClient";

export async function login(email, password) {
  const { data } = await authApi.post("/auth/login", {
    email: String(email).trim().toLowerCase(),
    password,
  });
  if (!data?.token) throw new Error("Respuesta de login inválida");
  return data; // { token, expiresIn, user }
}

export async function register({ email, password, tenantId, employeeId }) {
  const body = { email: String(email).trim().toLowerCase(), password, tenantId };
  if (employeeId && employeeId.trim()) body.employeeId = employeeId.trim();
  const { data } = await authApi.post("/auth/register", body);
  return data; // { user }
}
