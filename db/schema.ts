import { pgTable, text, boolean, integer, numeric, timestamp, uuid, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";

export const saleStatusEnum    = pgEnum("sale_status",    ["completed","pending","refunded","cancelled"]);
export const refundStatusEnum  = pgEnum("refund_status",  ["processed","pending","rejected"]);
export const userRoleEnum      = pgEnum("user_role",      ["owner","manager","cashier"]);
export const discountTypeEnum  = pgEnum("discount_type",  ["percentage","flat"]);
export const changeTypeEnum    = pgEnum("change_type",    ["sale","refund","restock","adjustment","damage"]);

export const vendors = pgTable("vendors", {
  id:           uuid("id").primaryKey().defaultRandom(),
  name:         text("name").notNull(),
  slug:         text("slug").unique(),
  ownerClerkId: text("owner_clerk_id").notNull(),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const vendorSettings = pgTable("vendor_settings", {
  id:        uuid("id").primaryKey().defaultRandom(),
  vendorId:  uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  key:       text("key").notNull(),
  value:     text("value"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({ uniq: uniqueIndex("idx_vs_vendor_key").on(t.vendorId, t.key) }));

export const users = pgTable("users", {
  id:        uuid("id").primaryKey().defaultRandom(),
  clerkId:   text("clerk_id").unique().notNull(),
  vendorId:  uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  email:     text("email"),
  name:      text("name"),
  role:      userRoleEnum("role").default("cashier"),
  isActive:  boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({ vidx: index("idx_users_vendor").on(t.vendorId) }));

export const customers = pgTable("customers", {
  id:            uuid("id").primaryKey().defaultRandom(),
  vendorId:      uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  name:          text("name"),
  phone:         text("phone"),
  email:         text("email"),
  loyaltyPoints: integer("loyalty_points").default(0),
  totalSpent:    numeric("total_spent", { precision: 12, scale: 2 }).default("0"),
  notes:         text("notes"),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({ vidx: index("idx_customers_vendor").on(t.vendorId) }));

export const categories = pgTable("categories", {
  id:        uuid("id").primaryKey().defaultRandom(),
  vendorId:  uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  color:     text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({ vidx: index("idx_categories_vendor").on(t.vendorId) }));

export const products = pgTable("products", {
  id:            uuid("id").primaryKey().defaultRandom(),
  vendorId:      uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  categoryId:    uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  name:          text("name").notNull(),
  description:   text("description"),
  sku:           text("sku"),
  price:         numeric("price", { precision: 12, scale: 2 }).notNull(),
  costPrice:     numeric("cost_price", { precision: 12, scale: 2 }),
  stockQuantity: integer("stock_quantity").default(0),
  lowStockAlert: integer("low_stock_alert").default(5),
  imageUrl:      text("image_url"),
  isActive:      boolean("is_active").default(true),
  deletedAt:     timestamp("deleted_at", { withTimezone: true }),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  vidx: index("idx_products_vendor").on(t.vendorId),
  cidx: index("idx_products_category").on(t.categoryId),
}));

export const discounts = pgTable("discounts", {
  id:             uuid("id").primaryKey().defaultRandom(),
  vendorId:       uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  code:           text("code"),
  description:    text("description"),
  discountType:   discountTypeEnum("discount_type").notNull(),
  value:          numeric("value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 12, scale: 2 }),
  maxUses:        integer("max_uses"),
  usesCount:      integer("uses_count").default(0),
  expiresAt:      timestamp("expires_at", { withTimezone: true }),
  isActive:       boolean("is_active").default(true),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({ vidx: index("idx_discounts_vendor").on(t.vendorId) }));

export const sales = pgTable("sales", {
  id:             uuid("id").primaryKey().defaultRandom(),
  vendorId:       uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  cashierId:      uuid("cashier_id").references(() => users.id, { onDelete: "set null" }),
  customerId:     uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  discountId:     uuid("discount_id").references(() => discounts.id, { onDelete: "set null" }),
  subtotal:       numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
  taxAmount:      numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount:    numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod:  text("payment_method").default("cash"),
  status:         saleStatusEnum("status").default("completed"),
  notes:          text("notes"),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  vidx:  index("idx_sales_vendor").on(t.vendorId),
  catx:  index("idx_sales_created_at").on(t.createdAt),
}));

export const saleItems = pgTable("sale_items", {
  id:          uuid("id").primaryKey().defaultRandom(),
  saleId:      uuid("sale_id").references(() => sales.id, { onDelete: "cascade" }),
  productId:   uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity:    integer("quantity").notNull(),
  unitPrice:   numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  discount:    numeric("discount", { precision: 12, scale: 2 }).default("0"),
  subtotal:    numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
}, (t) => ({ sidx: index("idx_sale_items_sale").on(t.saleId) }));

export const refunds = pgTable("refunds", {
  id:        uuid("id").primaryKey().defaultRandom(),
  saleId:    uuid("sale_id").references(() => sales.id, { onDelete: "cascade" }),
  vendorId:  uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  cashierId: uuid("cashier_id").references(() => users.id, { onDelete: "set null" }),
  amount:    numeric("amount", { precision: 12, scale: 2 }).notNull(),
  reason:    text("reason"),
  status:    refundStatusEnum("status").default("processed"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({ vidx: index("idx_refunds_vendor").on(t.vendorId) }));

export const inventoryLogs = pgTable("inventory_logs", {
  id:             uuid("id").primaryKey().defaultRandom(),
  productId:      uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
  vendorId:       uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  changeType:     changeTypeEnum("change_type").notNull(),
  quantityBefore: integer("quantity_before").notNull(),
  quantityChange: integer("quantity_change").notNull(),
  quantityAfter:  integer("quantity_after").notNull(),
  referenceId:    uuid("reference_id"),
  notes:          text("notes"),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({ vidx: index("idx_inv_vendor").on(t.vendorId) }));

export const auditLogs = pgTable("audit_logs", {
  id:        uuid("id").primaryKey().defaultRandom(),
  vendorId:  uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action:    text("action").notNull(),
  tableName: text("table_name"),
  recordId:  uuid("record_id"),
  oldData:   text("old_data"),
  newData:   text("new_data"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({ vidx: index("idx_audit_vendor").on(t.vendorId) }));

export type Vendor        = typeof vendors.$inferSelect;
export type VendorSetting = typeof vendorSettings.$inferSelect;
export type User          = typeof users.$inferSelect;
export type Customer      = typeof customers.$inferSelect;
export type NewCustomer   = typeof customers.$inferInsert;
export type Category      = typeof categories.$inferSelect;
export type NewCategory   = typeof categories.$inferInsert;
export type Product       = typeof products.$inferSelect;
export type NewProduct    = typeof products.$inferInsert;
export type Discount      = typeof discounts.$inferSelect;
export type NewDiscount   = typeof discounts.$inferInsert;
export type Sale          = typeof sales.$inferSelect;
export type SaleItem      = typeof saleItems.$inferSelect;
export type Refund        = typeof refunds.$inferSelect;
export type InventoryLog  = typeof inventoryLogs.$inferSelect;
export type AuditLog      = typeof auditLogs.$inferSelect;
