export const ROLES = {
  ADMIN: "ADMIN",
  HR: "HR",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
};

export const HR_ROLES = [ROLES.ADMIN, ROLES.HR];

export function hasAnyRole(user, roles) {
  if (!roles || roles.length === 0) return true;
  return !!user && roles.includes(user.role);
}
