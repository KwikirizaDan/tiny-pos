export type UserRole = 'owner' | 'manager' | 'cashier';
export type SaleStatus = 'completed' | 'pending' | 'refunded' | 'cancelled';
export type RefundStatus = 'processed' | 'pending' | 'rejected';
export type DiscountType = 'percentage' | 'flat';
export type ChangeType = 'sale' | 'refund' | 'restock' | 'adjustment' | 'damage';

export interface Vendor {
  id: string;
  name: string;
  slug: string | null;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  authId: string;
  vendorId: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  vendorId: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  price: string | number;
  costPrice: string | number | null;
  stockQuantity: number;
  lowStockAlert: number;
  imageUrl: string | null;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  vendorId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  loyaltyPoints: number;
  totalSpent: string | number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  vendorId: string;
  cashierId: string | null;
  customerId: string | null;
  discountId: string | null;
  subtotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  paymentMethod: string;
  status: SaleStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: string | number;
  discount: string | number;
  subtotal: string | number;
}

export interface Refund {
  id: string;
  saleId: string;
  vendorId: string;
  cashierId: string | null;
  amount: string | number;
  reason: string | null;
  status: RefundStatus;
  createdAt: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  vendorId: string;
  changeType: ChangeType;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  vendorId: string;
  userId: string | null;
  action: string;
  tableName: string | null;
  recordId: string | null;
  oldData: string | null;
  newData: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface Discount {
  id: string;
  vendorId: string;
  code: string | null;
  description: string | null;
  discountType: DiscountType;
  value: string | number;
  minOrderAmount: string | number | null;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}
