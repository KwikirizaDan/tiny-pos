import type { UserRole } from "@/types/pos";

export const PERMISSIONS = {
  // Sales
  "pos.use":          ["owner", "manager", "cashier"],
  "orders.view":      ["owner", "manager", "cashier"],
  "orders.refund":    ["owner", "manager"],
  // Catalogue
  "products.view":    ["owner", "manager", "cashier"],
  "products.manage":  ["owner", "manager"],
  "categories.manage":["owner", "manager"],
  "inventory.manage": ["owner", "manager"],
  "qr.manage":        ["owner", "manager"],
  // Customers
  "customers.view":   ["owner", "manager", "cashier"],
  "discounts.manage": ["owner", "manager"],
  // Insights
  "reports.view":     ["owner", "manager"],
  // Admin
  "staff.view":       ["owner", "manager"],
  "staff.manage":     ["owner"],
  "audit.view":       ["owner"],
  "settings.manage":  ["owner", "manager"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner:   "Owner",
  manager: "Manager",
  cashier: "Cashier",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner:   "Full access — manage staff, settings, reports and all operations",
  manager: "Can manage products, inventory, orders, discounts and view reports",
  cashier: "Can process sales, view products, customers and their own orders",
};

export const ROLE_CAPABILITIES: Record<UserRole, string[]> = {
  owner: [
    "Process sales & refunds",
    "Manage products & inventory",
    "Manage staff & roles",
    "View reports & audit logs",
    "Configure store settings",
    "Manage discounts",
  ],
  manager: [
    "Process sales & refunds",
    "Manage products & inventory",
    "View & manage staff",
    "View reports",
    "Configure basic settings",
    "Manage discounts",
  ],
  cashier: [
    "Process sales",
    "View products & customers",
    "View own orders",
  ],
};
