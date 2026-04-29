export type Role =
  | "master_admin"
  | "admin"
  | "sales"
  | "crew_leader"
  | "crew_member";

export type Permissions = {
  role:                Role;
  defaultRoute:        string;

  // System
  canManageTeam:       boolean;
  canViewSettings:     boolean;

  // Jobs
  canViewAllJobs:      boolean;
  canViewOwnJobs:      boolean;
  canEditJobs:         boolean;
  canAssignJobs:       boolean;
  canDeleteJobs:       boolean;
  canBulkEditJobs:     boolean;

  // Customers & messaging
  canViewCustomers:    boolean;
  canMessageCustomers: boolean;

  // Quotes
  canViewQuotes:       boolean;
  canCreateQuotes:     boolean;
  canEditQuotes:       boolean;

  // Crew schedule
  canViewCrew:         boolean;
};

export const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  master_admin: {
    role:                "master_admin",
    defaultRoute:        "/dashboard",
    canManageTeam:       true,
    canViewSettings:     true,
    canViewAllJobs:      true,
    canViewOwnJobs:      true,
    canEditJobs:         true,
    canAssignJobs:       true,
    canDeleteJobs:       true,
    canBulkEditJobs:     true,
    canViewCustomers:    true,
    canMessageCustomers: true,
    canViewQuotes:       true,
    canCreateQuotes:     true,
    canEditQuotes:       true,
    canViewCrew:         true,
  },

  admin: {
    role:                "admin",
    defaultRoute:        "/dashboard",
    canManageTeam:       false,
    canViewSettings:     false,
    canViewAllJobs:      true,
    canViewOwnJobs:      true,
    canEditJobs:         true,
    canAssignJobs:       true,
    canDeleteJobs:       false,
    canBulkEditJobs:     false,
    canViewCustomers:    true,
    canMessageCustomers: true,
    canViewQuotes:       true,
    canCreateQuotes:     false,
    canEditQuotes:       false,
    canViewCrew:         true,
  },

  sales: {
    role:                "sales",
    defaultRoute:        "/dashboard/quotes",
    canManageTeam:       false,
    canViewSettings:     false,
    canViewAllJobs:      false,
    canViewOwnJobs:      false,
    canEditJobs:         false,
    canAssignJobs:       false,
    canDeleteJobs:       false,
    canBulkEditJobs:     false,
    canViewCustomers:    true,
    canMessageCustomers: false,
    canViewQuotes:       true,
    canCreateQuotes:     true,
    canEditQuotes:       true,
    canViewCrew:         false,
  },

  crew_leader: {
    role:                "crew_leader",
    defaultRoute:        "/dashboard/jobs",
    canManageTeam:       false,
    canViewSettings:     false,
    canViewAllJobs:      true,
    canViewOwnJobs:      true,
    canEditJobs:         false,
    canAssignJobs:       false,
    canDeleteJobs:       false,
    canBulkEditJobs:     false,
    canViewCustomers:    false,
    canMessageCustomers: false,
    canViewQuotes:       false,
    canCreateQuotes:     false,
    canEditQuotes:       false,
    canViewCrew:         true,
  },

  crew_member: {
    role:                "crew_member",
    defaultRoute:        "/dashboard/jobs",
    canManageTeam:       false,
    canViewSettings:     false,
    canViewAllJobs:      false,
    canViewOwnJobs:      true,
    canEditJobs:         false,
    canAssignJobs:       false,
    canDeleteJobs:       false,
    canBulkEditJobs:     false,
    canViewCustomers:    false,
    canMessageCustomers: false,
    canViewQuotes:       false,
    canCreateQuotes:     false,
    canEditQuotes:       false,
    canViewCrew:         false,
  },
};

export const FULL_PERMISSIONS: Permissions = ROLE_PERMISSIONS.master_admin;
