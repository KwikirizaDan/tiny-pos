# Future Improvements & Roadmap

This document outlines potential features and technical enhancements to improve TinyPOS.

## 🚀 New Features

### 1. Loyalty & Rewards Program
- **Redemption Logic:** Implement the ability for customers to spend their accumulated loyalty points during checkout.
- **Tiered Rewards:** Create different tiers (e.g., Bronze, Silver, Gold) based on total spent.

### 2. Supplier & Purchase Order Management
- **Suppliers:** Add a directory for suppliers/vendors where products are sourced.
- **Purchase Orders:** Automate restocking by creating POs when inventory hits the "Low Stock Alert" threshold.

### 3. Advanced Analytics & Reporting
- **Visual Dashboards:** Add charts (Bar, Line, Pie) using libraries like `Recharts` or `Chart.js` to track sales trends over time.
- **Exporting:** Allow exporting reports (Sales, Inventory, Tax) to CSV, Excel, and PDF.
- **Profit Tracking:** Calculate "Gross Profit" based on the `cost_price` and `price` fields.

### 4. Multi-Location Support
- Support for businesses with multiple branches/warehouses under a single vendor account.
- Inter-store stock transfers.

### 5. Enhanced Payment Methods
- **Mobile Money Integration:** Specifically for the East African market (MTN, Airtel) using gateways like Flutterwave or Pesapal.
- **Split Payments:** Allow customers to pay using a mix of Cash and Card.

---

## 🛠 Technical Enhancements

### 1. Real-time Inventory Updates
- Use **Supabase Realtime** to sync stock levels across all active POS terminals immediately when a sale happens at one terminal.

### 2. Robust Offline Sync
- **Conflict Resolution:** Improve the `lib/idb.ts` logic to handle cases where two cashiers sell the same last item while offline.
- **Background Sync:** Use Service Workers to sync pending sales in the background even when the tab is closed.

### 3. Advanced RLS & Security
- **Granular Permissions:** Implement more specific RLS policies based on `user_role` (e.g., Cashiers shouldn't be able to delete products or view audit logs).
- **2FA:** Enable Two-Factor Authentication via Supabase Auth for Manager and Owner accounts.

### 4. Testing Suite
- **Unit Tests:** Add Vitest/Jest for business logic (price calculations, tax logic).
- **E2E Tests:** Use Playwright to test the critical "Happy Path" from product scan to checkout.

---

## 🎨 UI/UX Improvements

### 1. Progressive Web App (PWA)
- Fully configure the `manifest.json` and `sw.js` to make the app "Installable" on Android and iOS devices.

### 2. Dark Mode Support
- Implement a theme switcher using `next-themes` and Tailwind CSS.

### 3. Customisable Receipt Templates
- A drag-and-drop builder for receipts so vendors can add their own logos, social media handles, and custom "Thank You" notes.

### 4. Keyboard Shortcuts
- Add hotkeys for common actions in the POS terminal (e.g., `F1` for Search, `Space` for Checkout, `Esc` to Clear Cart).
