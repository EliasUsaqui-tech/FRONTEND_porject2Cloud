export const ROLES = {
  ADMIN: "ADMIN",
  HR: "HR",
  HR_MANAGER: "HR_MANAGER",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
};

export const HR_ROLES = [ROLES.ADMIN, ROLES.HR];
// El middleware ACL de Core HR y cálculo de nómina acepta HR como alias de HR_MANAGER.
export const CORE_WRITE_ROLES = [...HR_ROLES, ROLES.HR_MANAGER];
export const PAYROLL_PERIOD_ROLES = [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, "HR_ADMIN", "PAYROLL_ADMIN"];
export const RECRUITMENT_ROLES = CORE_WRITE_ROLES;
export const CORE_READ_ROLES = [...CORE_WRITE_ROLES, ROLES.EMPLOYEE];
export const PERFORMANCE_MANAGE_ROLES = [...CORE_WRITE_ROLES, ROLES.MANAGER];

export function hasAnyRole(user, roles) {
  if (!roles || roles.length === 0) return true;
  return !!user && roles.includes(user.role);
}
