# TinyPOS — Full System Audit

**Date:** 2026-05-04  
**Project:** TinyPOS by Binary Labs  
**Auditor:** Claude Code (Sonnet 4.6)  
**Scope:** Full codebase — architecture, security, performance, feature completeness

---

## 1. Project Structure

**Framework & Configuration:**
- Next.js 16.2.1 — App Router, Turbopack
- TypeScript 6.0.2 — strict mode enabled
- Tailwind CSS 4.2.2 with PostCSS 4
- Target ES2017 for broad browser compatibility

**Key Directories:**
```
/app
  /(dashboard)/       — Role-based dashboard routes (11 pages)
  /(scanner)/         — Scan/QR code routes
  /api/               — REST API endpoints (13+ routes)
  /auth/              — OAuth callbacks and error pages
/components/
  /layout/            — Sidebar, Header, DashboardLayout, UserMenu
  /auth/              — LoginForm, SignUpForm
  /[feature]/         — 14 feature-specific client components
  /ui/                — shadcn/ui + Base UI component library
/lib/
  /supabase/          — Server/client/middleware SSR setup
  permissions.ts      — RBAC matrix
  vendor.ts           — Vendor/user getters
  require-role.ts     — Server-side auth guard
  auto-vendor.ts      — Onboarding vendor creation helper
  hooks.ts            — useUser() hook
  idb.ts              — IndexedDB for offline POS mode
/types/pos.ts         — All TypeScript interfaces
```

---

## 2. Authentication & Auth Flow

**Pages:**
- `/sign-in` — `LoginForm` component (Supabase signInWithPassword)
- `/sign-up` — `SignUpForm` component; checks if email is pre-registered staff
- `/forgot-password` — Password reset (page exists, **flow incomplete**)

**Session Management (`proxy.ts`):**
- Invokes `updateSession()` from `lib/supabase/middleware.ts` on every request
- Refreshes Supabase session cookie; uses `supabase.auth.getUser()` server-side
- Matcher: all routes except static assets, images, CSS, favicons

**Auth Callback (`/auth/callback/route.ts`):**
- Exchanges OAuth code for session
- Supports `?next` query param for post-login redirect (default: `/dashboard`)
- Error page: `/auth/auth-code-error`

**Onboarding (`/onboarding`):**
- Server checks auth + whether vendor exists; redirects to `/dashboard` if already set up
- 2-step form: step 1 (store name + slug), step 2 (phone, address, currency)
- Calls Postgres RPC `create_vendor_for_user()` — atomically creates vendor + owner profile
- Handles slug collision (`SLUG_TAKEN` exception mapped to user-facing message)

**Staff Login Flow:**
- Owner pre-registers staff email + role in `/staff`
- Staff signs up at `/sign-up` using that email
- `SignUpForm` detects existing profile by email → updates `auth_id` to link account → redirects to `/dashboard`

---

## 3. Database & Supabase

**Client Setup:**

| File | Type | Purpose |
|------|------|---------|
| `lib/supabase/server.ts` | SSR | Cookie-based server client; used in Server Components and API routes |
| `lib/supabase/client.ts` | Browser | Browser client for client components |
| `lib/supabase/middleware.ts` | Middleware | Session refresh helper |

**Environment Variables (from `.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```
> Note: Uses `PUBLISHABLE_KEY`, not the older `ANON_KEY` naming.

**Known SQL Functions:**
- `create_vendor_for_user(p_name, p_slug, p_phone, p_address, p_currency)` — SECURITY DEFINER; creates vendor + owner user record atomically; required because RLS blocks the INSERT otherwise

**Database Schema (inferred from code):**

| Table | Key Columns |
|-------|-------------|
| `vendors` | id, name, slug, owner_id, is_active, created_at |
| `users` | id, auth_id, vendor_id, email, name, role, is_active, is_super_admin |
| `products` | id, vendor_id, category_id, name, sku, price, cost_price, stock_quantity, low_stock_alert, image_url, is_active, deleted_at |
| `categories` | id, vendor_id, name, color |
| `sales` | id, vendor_id, cashier_id, customer_id, discount_id, subtotal, discount_amount, tax_amount, total_amount, payment_method, status, notes |
| `sale_items` | id, sale_id, product_id, product_name, quantity, unit_price, discount, subtotal |
| `customers` | id, vendor_id, name, phone, email, loyalty_points, total_spent, notes |
| `refunds` | id, sale_id, vendor_id, cashier_id, amount, reason, status |
| `discounts` | id, vendor_id, code, discount_type, value, min_order_amount, max_uses, uses_count, expires_at, is_active |
| `inventory_logs` | id, product_id, vendor_id, change_type, quantity_before, quantity_change, quantity_after, reference_id, notes |
| `audit_logs` | id, vendor_id, user_id, action, table_name, record_id, old_data, new_data, ip_address |
| `vendor_settings` | vendor_id, key, value |

---

## 4. API Routes

All routes in `/app/api/`:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/vendor` | GET, POST | Get/create vendor |
| `/vendor/user` | POST | Create user record |
| `/create-vendor` | POST | Auto-create default vendor |
| `/products` | GET, POST | List/create products |
| `/products/[id]` | PATCH, DELETE | Update/delete product |
| `/categories` | GET, POST | List/create categories |
| `/categories/[id]` | PATCH, DELETE | Update/delete category |
| `/customers` | GET, POST | List/create customers |
| `/customers/[id]` | PATCH, DELETE | Update/delete customer |
| `/orders` | GET, POST | List/create sales |
| `/discounts` | GET, POST | List/create discounts |
| `/discounts/[id]` | PATCH, DELETE | Update/delete discount |
| `/refunds` | GET, POST | List/create refunds |
| `/refunds/[id]` | PATCH | Update refund status |
| `/staff` | GET, POST | List/create staff |
| `/staff/[id]` | PATCH, DELETE | Update/delete staff |
| `/inventory` | GET, POST | List/create inventory logs |
| `/reports` | GET | Sales analytics with date filtering |
| `/settings` | GET, POST | Get/update vendor settings |
| `/audit` | GET | Get audit logs (last 200) |

**Common Auth Pattern in All Routes:**
1. `supabase.auth.getUser()` → 401 if not authed
2. `getVendor()` → 404 if no vendor for this user
3. Verify resource belongs to vendor via `vendor_id`
4. Perform operation → return 200/201 or error

---

## 5. Server Actions

All in `app/(dashboard)/[feature]/actions.ts`:

| Module | Functions | Validation |
|--------|-----------|-----------|
| `products/actions.ts` | `createProduct`, `updateProduct`, `deleteProduct` | Zod (name, price, stockQuantity) |
| `categories/actions.ts` | `createCategory`, `updateCategory`, `deleteCategory` | Zod (name, color) |
| `customers/actions.ts` | `createCustomer`, `updateCustomer`, `deleteCustomer` | Zod (name, phone, email) |
| `orders/actions.ts` | `createOrder` | Zod (items, paymentMethod, cashierId) |
| `discounts/actions.ts` | `createDiscount`, `updateDiscount`, `deleteDiscount` | Zod (code, type, value) |
| `refunds/actions.ts` | `createRefund` | Zod (saleId, amount, reason) |
| `inventory/actions.ts` | `createInventoryLog` | Zod (productId, changeType, quantityChange) |
| `staff/actions.ts` | `createStaff`, `updateStaff`, `deleteStaff` | Zod (email, name, role, isActive) |
| `settings/actions.ts` | `updateSetting`, `updateMultipleSettings` | Zod (key, value) |
| `onboarding/actions.ts` | `createStore` | Zod (storeName, slug, phone, address, currency) |

All actions: call `getVendor()` → use `revalidatePath()` after mutations → throw on error.

---

## 6. Middleware & Auth Guards

**`proxy.ts`** — Next.js 16 middleware entry point  
- Calls `updateSession()` on every request  
- Refreshes token in cookie; no redirect logic here

**`lib/require-role.ts`** — Page-level permission guard
```ts
export async function requireRole(permission: Permission): Promise<{ role: UserRole }>
```
- Fetches auth user → looks up `/users` profile by `auth_id`
- If no profile but user owns a vendor → role = `"owner"` (handles owner without staff row)
- If profile exists but `is_active = false` → redirect `/dashboard`
- If role lacks permission → redirect `/dashboard`

**Used on:** `staff`, `audit`, `reports`, `settings`, `discounts`, `refunds`, `inventory`

**`lib/vendor.ts`** — Vendor + user helpers
- `getVendor()` — Redirects to `/onboarding` if no vendor found
- `getVendorUser()` — Returns staff profile or inferred `{ role: "owner" }` for vendor owners

---

## 7. Role-Based Access Control

**`lib/permissions.ts` — PERMISSIONS matrix:**

| Permission | Owner | Manager | Cashier |
|-----------|-------|---------|---------|
| `pos.use` | ✓ | ✓ | ✓ |
| `orders.view` | ✓ | ✓ | ✓ |
| `products.view` | ✓ | ✓ | ✓ |
| `customers.view` | ✓ | ✓ | ✓ |
| `orders.refund` | ✓ | ✓ | — |
| `products.manage` | ✓ | ✓ | — |
| `categories.manage` | ✓ | ✓ | — |
| `inventory.manage` | ✓ | ✓ | — |
| `discounts.manage` | ✓ | ✓ | — |
| `reports.view` | ✓ | ✓ | — |
| `staff.view` | ✓ | ✓ | — |
| `settings.manage` | ✓ | ✓ | — |
| `qr.manage` | ✓ | ✓ | — |
| `staff.manage` | ✓ | — | — |
| `audit.view` | ✓ | — | — |

**Sidebar Filtering (`components/layout/sidebar.tsx`):**
- `userRole` prop passed from server layout (no client-side async guess)
- Nav items with `roles` array are filtered before render
- Prevents menu confusion for restricted users

---

## 8. Pages & Features

| Page | Route | Auth | Notes |
|------|-------|------|-------|
| Dashboard | `/dashboard` | `getVendor()` | 6 parallel DB queries; KPI tiles, recent sales, low-stock list |
| POS Terminal | `/pos` | `getVendor()` | Offline mode via IndexedDB, receipt printing |
| Scan POS | `/scan` | `getVendor()` | ZXing barcode/QR decoder |
| Orders | `/orders` | `getVendor()` | Sales history, receipt reprint |
| Products | `/products` | `getVendor()` | Filter by category, CRUD |
| Categories | `/categories` | `getVendor()` | Product count per category |
| QR Codes | `/qr-codes` | `getVendor()` | QR code generator |
| Customers | `/customers` | `getVendor()` | Loyalty points + total spent |
| Discounts | `/discounts` | `requireRole("discounts.manage")` | % or flat, expiry, max uses |
| Refunds | `/refunds` | `requireRole("orders.refund")` | Links to original sale |
| Inventory | `/inventory` | `requireRole("inventory.manage")` | 5 change types: sale, refund, restock, adjustment, damage |
| Reports | `/reports` | `requireRole("reports.view")` | Date range, daily + product breakdowns |
| Staff | `/staff` | `requireRole("staff.view")` | Owner-only CRUD; role badges |
| Settings | `/settings` | `requireRole("settings.manage")` | Receipt header/footer, currency, tax rate |
| Audit Logs | `/audit` | `requireRole("audit.view")` | Last 200 entries; owner only |

---

## 9. Components

**Layout:**
- `sidebar.tsx` — Collapsible (w-52 ↔ w-14); role-filtered nav groups; role passed as server prop
- `header.tsx` — Top bar
- `dashboard-layout-client.tsx` — Root layout wrapper; `userRole` from server
- `user-menu.tsx` — Profile dropdown (email + sign-out); Base UI DropdownMenu
- `logo.tsx` — SVG logo (indigo-violet gradient, receipt icon, emerald badge)

**Auth:**
- `login-03.tsx` — Sign-in form; logo header; eye/eye-off password toggle
- `sign-up.tsx` — Sign-up form; logo header; eye/eye-off password toggle; staff linking logic

**UI Library:**
`button`, `input`, `card`, `dialog`, `label`, `dropdown-menu`, `select`, `table`, `badge`, `separator`, `skeleton`, `preloader`, `logo`, `field`

---

## 10. State Management

- **Server Components** fetch all initial data (Supabase queries in page.tsx)
- Props passed down to `"use client"` feature components
- Local state via `useState()` — filters, cart, dialogs, forms
- No Redux, Zustand, or React Context
- `revalidatePath()` clears Next.js cache after mutations
- **Offline:** `lib/idb.ts` — IndexedDB for POS; stores products/categories + pending sales queue

---

## 11. Mobile Project (`/home/dan/Desktop/tiny-pos-mobile`)

- Same Next.js stack; `output: "export"` for static HTML
- Capacitor 8.3.1 wraps the export for iOS + Android
- App ID: `com.binarylabs.tinypos`; webDir: `out`
- Bottom nav: 5 tabs (Home, Terminal, Scan, Orders, Products)
- Auth guard in `app/(app)/layout.tsx`
- Same Supabase instance as web

---

## 12. Known Issues & Bugs

### Type Safety
- **19 instances** of `as any` across pages and components
- Examples: `mappedProducts as any`, `vendor as any`, `recentSales as any`
- Impact: bypasses prop type checking; masks schema mismatches

### Parse Errors Fixed
- `reports/page.tsx` and `audit/page.tsx` had curly-quote strings `""reports.view""` causing compile failures (now fixed)

### Console Logging in Production Code
- `orders/actions.ts:101` — `console.error("Order error:", error)`
- `refunds/actions.ts:62` — `console.error("Refund error:", error)`
- `api/orders/route.ts:120` — Same pattern

### Service Worker Caching
- Registered in `app/layout.tsx` via inline script
- Served from `/sw.js` (likely missing or misconfigured)
- Causes `GET /globals.css 404` on every page load
- **Hard refresh does not clear SW cache** — requires DevTools → Application → Clear site data

### Incomplete Features
- `/forgot-password` — Page exists, no email flow wired up
- Staff `auth_id` placeholder — Created records with `crypto.randomUUID()` until real signup; no explicit linking after the fact
- `isSuperAdmin` field on users — Never used in RBAC logic

---

## 13. Security Concerns

### Strengths
- Server Actions for all mutations (no raw API calls from client)
- Every operation scoped to `vendor_id`
- `requireRole()` enforces server-side permission checks before page renders
- Owner fallback in `require-role.ts` correctly handles no-staff-row case

### Gaps & Risks

| # | Risk | Severity | Detail |
|---|------|----------|--------|
| 1 | **Staff auth linking** | High | Staff records created with random `auth_id`. The signup flow links by email match — but only at signup time. If a staff member creates a new account later, they won't re-link. |
| 2 | **Discount not enforced server-side** | High | Discount logic appears client-side only in POS. `createOrder()` should validate discount code + recalculate total server-side. |
| 3 | **RLS policies unverified** | High | All multi-tenant isolation relies on `vendor_id` in queries. If any table is missing RLS, one vendor can read another's data. Verify all tables have policies. |
| 4 | **API routes assume owner = auth user** | Medium | Routes use `eq('owner_id', user.id)` — managers/cashiers can't call APIs directly, which is correct, but no explicit check rejects them with a clear error. |
| 5 | **No API rate limiting** | Medium | No throttle on login or API endpoints. Supabase has some defaults but verify they're configured. |
| 6 | **Offline IDB data unencrypted** | Low | Pending sales in IndexedDB are plaintext in browser storage. Acceptable for most contexts; note for compliance. |
| 7 | **No input sanitization beyond Zod** | Low | Zod validates types/formats but not content. Low risk since data is stored and rendered as text. |
| 8 | **Tax rate hardcoded to 0.0** | Low | POS terminal has `TAX_RATE = 0.0`; no configurable tax. Expose via settings. |

---

## 14. Performance

### Positive
- Server Components for data fetching (zero client JS overhead)
- `Promise.all()` for parallel DB queries on dashboard (6 queries concurrent)
- Limits on expensive queries (audit: 200 rows, orders: 200 rows)
- Turbopack builds in ~300ms

### Concerns

| Issue | Impact | Fix |
|-------|--------|-----|
| Low-stock filter done in JS, not SQL | Scales poorly past ~1000 products | Add `WHERE stock_quantity <= low_stock_alert` to query |
| Reports aggregate in JS after full table scan | Slow at scale | Use SQL aggregations (SUM, GROUP BY) |
| No pagination on product/order grids | Large catalogs will be slow | Add cursor-based pagination |
| No loading skeletons on most pages | UX freeze during navigation | Add `loading.tsx` per route segment |
| Receipt printing opens new window | Slow on mobile | Use CSS `@media print` in-page instead |

---

## 15. Missing Features & Gaps

| Feature | Status | Priority |
|---------|--------|----------|
| Password reset flow | Page exists, no implementation | High |
| Staff email invitation | Pre-register works; no invite link | High |
| Discount enforcement (server-side) | Client-only currently | High |
| Tax configuration in settings | Hardcoded 0.0 | High |
| Product barcode field | `image_url` exists; no barcode | Medium |
| Customer loyalty point increment | Field exists; never updated on purchase | Medium |
| QR code → product linking | QR generated; not linked to scan lookup | Medium |
| CSV/Excel product import | Export exists (xlsx/jsPDF); no import | Medium |
| Super admin panel | `isSuperAdmin` field unused | Low |
| Push notifications / low-stock alerts | Dashboard shows it; no notification sent | Low |
| Bulk product operations | No multi-select delete/update | Low |
| Multi-currency per product | Single currency per vendor | Low |

---

## 16. Dependency Audit

| Package | Purpose | Note |
|---------|---------|------|
| `@supabase/ssr` | SSR auth + session | Core |
| `react-hook-form` + `zod` | Form validation | Solid usage |
| `@base-ui/react` | Unstyled UI primitives (DropdownMenu, etc.) | Some context issues with GroupLabel |
| `@radix-ui/*` | Accessible primitives | Standard |
| `lucide-react` | Icons | ~200 icons in bundle; consider tree-shake |
| `sonner` | Toast notifications | Good |
| `qrcode` | QR generation | Used in qr-codes page |
| `jspdf` + `jspdf-autotable` | PDF export | Referenced; verify it's actually called |
| `xlsx` | Excel export | Referenced; verify it's actually called |
| `@zxing/browser` + `@zxing/library` | Barcode scanning | Used in scan page |
| `idb` | IndexedDB wrapper | Used for offline POS |

---

## 17. Summary Scorecard

| Category | Grade | Notes |
|----------|-------|-------|
| Architecture | ✅ Good | Clean App Router structure; Server Actions; proper auth layering |
| Type Safety | ⚠️ Partial | 19× `as any`; Zod at boundaries; missing strict prop types |
| Authentication | ✅ Good | Supabase SSR; session refresh; staff linking flow |
| Authorization (RBAC) | ✅ Good | Permission matrix; server guards; sidebar filtering from server |
| API Design | ✅ Good | RESTful; vendor-scoped; consistent error handling |
| Security | ⚠️ Gaps | Discount enforcement missing server-side; RLS unverified; no rate limit |
| Performance | ⚠️ Issues | JS aggregations; no pagination; no loading states |
| Offline Support | ✅ Good | IndexedDB queue; sync on reconnect |
| Error Handling | ⚠️ Partial | Zod validation good; some missing try-catch; console.error in prod |
| Feature Completeness | ⚠️ ~70% | Core POS functional; discounts/tax/loyalty/invites incomplete |
| Testing | ❌ None | No test files, no test config, no CI |
| Documentation | ❌ None | No README, no CLAUDE.md, no inline docs |
| Mobile | ⚠️ Partial | Capacitor configured; no mobile-specific optimizations |

---

## 18. Recommended Next Steps (Priority Order)

1. **Enforce discounts server-side** in `createOrder()` — validate code, check expiry + max uses, recalculate total
2. **Wire up forgot-password** — `supabase.auth.resetPasswordForEmail()` + update-password page
3. **Verify RLS policies** — Run `SELECT tablename, policyname FROM pg_policies` in Supabase SQL editor; ensure all tables are covered
4. **Add tax rate to settings** — Expose `TAX_RATE` as a vendor setting; apply in `createOrder()`
5. **Add SQL aggregations to reports** — Replace JS reduce with `GROUP BY date(created_at)` in Postgres
6. **Add `loading.tsx` per route** — Skeleton screens for all dashboard routes
7. **Increment loyalty points on purchase** — Update `customers.loyalty_points` in `createOrder()`
8. **Link barcodes to products** — Add `barcode` field to products; use in scan page lookup
9. **Staff email invite** — Generate unique signup link; validate on signup; link auth_id
10. **Add pagination** — Products, orders, customers grids (cursor-based)
