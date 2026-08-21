export const administratorRoles = ["OWNER", "MANAGER", "FULFILLMENT"] as const;

export type AdministratorRole = (typeof administratorRoles)[number];

export interface Administrator {
  id: string;
  name: string;
  email: string;
  role: AdministratorRole;
}

export interface RequestMetadata {
  ipAddress: string;
  userAgent: string | null;
}
