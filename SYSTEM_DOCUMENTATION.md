# TinyPOS - Technical System Documentation

**Version:** 1.0  
**Project:** Tiny Point of Sale (TinyPOS)  
**Stack:** Next.js, Supabase, Tailwind CSS, TypeScript

---

## 1. Executive Summary
TinyPOS is a modern, lightweight, and offline-capable Point of Sale system designed for small to medium-sized retail businesses. It provides a seamless interface for sales terminal operations, inventory tracking, customer loyalty management, and administrative oversight.

---

## 2. System Architecture

### 2.1 Technology Stack
- **Frontend:** Next.js (App Router), React, Tailwind CSS.
- **Backend:** Supabase (Auth, Database, Storage).
- **Offline Capability:** IndexedDB (via `idb.ts`) for local caching and offline sale storage.
- **Language:** TypeScript for end-to-end type safety.

### 2.2 Data Isolation (Multitenancy)
The system uses a **Vendor-based isolation** model. 
- Every data record (product, sale, customer) is linked to a `vendor_id`.
- Row Level Security (RLS) in Supabase ensures that a user can only query or modify data belonging to their specific vendor.

---

## 3. System Flow

### 3.1 Authentication & Onboarding
1. **Sign Up/In:** Users authenticate via email/password.
2. **Auto-Onboarding:** Upon first sign-in, the system detects if the user has an associated `vendor`. If not, `createDefaultVendor` is triggered to create a Store and an Owner profile.
3. **Session Management:** Supabase Middleware refreshes sessions and handles redirects to the login page for unauthenticated requests.

### 3.2 Sales Workflow (POS)
1. **Terminal Load:** Products and Categories are fetched from Supabase and cached in the browser's **IndexedDB**.
2. **Cart Management:** Users select products via the grid or barcode scan.
3. **Checkout:**
   - **Online:** Sale is sent to the `/api/orders` endpoint, stock is deducted in real-time.
   - **Offline:** Sale is saved to IndexedDB. A background listener syncs pending sales once connection is restored.
4. **Receipt Generation:** A dynamic HTML/CSS receipt is generated for thermal printing.

### 3.3 Inventory Management
1. **Tracking:** Every stock change (Sale, Refund, Restock) creates an entry in the `inventory_logs` table.
2. **Alerts:** The Dashboard monitors `stock_quantity` against `low_stock_alert` thresholds to trigger warnings for the manager.

---

## 4. Core Modules

### 4.1 Sales Terminal (POS)
- **Search & Filter:** Fast filtering by product name, SKU, or category.
- **Scanning:** Integrated QR/Barcode scanning using device cameras.
- **Multi-Payment:** Support for Cash and Card transactions.

### 4.2 Team Management (RBAC)
The system employs Role-Based Access Control with three levels:
- **Owner:** Full store control, financial reports, and audit logs.
- **Manager:** Inventory management, staff updates, and sales viewing.
- **Cashier:** Restricted to Sales Terminal and Order viewing only.

### 4.3 Automatic QR Code Generation
- **Dynamic Generation:** The system automatically generates high-quality QR codes for every product using the `qrcode` library.
- **Data Encoding:** QR codes encode product identifiers (ID or SKU) in a JSON-compatible format, allowing for instant recognition by the Scan POS terminal.
- **Batch Printing:** A dedicated QR Code management page allows owners to generate and print labels for their entire product catalogue on standard label sheets or thermal printers.

### 4.4 Customer Loyalty
- **Profiles:** Tracking customer contact info and purchase history.
- **Loyalty Points:** Automatic point accumulation (1% of sale value) to encourage repeat business.

---

## 5. Database Schema Overview

| Table | Purpose |
|-------|---------|
| `vendors` | The top-level store entity. |
| `users` | Staff profiles with roles and vendor links. |
| `products` | Product catalogue with pricing and stock levels. |
| `sales` | Header record for every transaction. |
| `sale_items` | Individual line items within a sale. |
| `inventory_logs` | Immutable audit trail of all stock movements. |
| `audit_logs` | Security logs tracking administrative actions. |

---

## 6. Security & Compliance
- **RLS:** All SQL queries are filtered at the database level using `auth.uid()`.
- **Validation:** Server-side Zod schemas validate all incoming data to prevent injection or malformed records.
- **Audit Trails:** Critical changes (price updates, staff removals) are logged for owner review.

---

## 7. Operational Guidelines for Developers
### Local Development
1. Clone repository.
2. Setup `.env.local` with Supabase credentials.
3. Run `npm install` and `npm run dev`.
4. Use `supabase_schema.sql` to initialize the database in the Supabase SQL Editor.

---
*Documentation generated for TinyPOS Project by Gemini CLI.*
