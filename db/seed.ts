/**
 * Usage: USER_ID=your_clerk_user_id npx tsx db/seed.ts
 */
import { getDb, products } from "./index";

const USER_ID = process.env.USER_ID;
if (!USER_ID) throw new Error("Set USER_ID env var to your Clerk user id");

const sampleProducts = [
  { name: "Coca Cola 500ml", price: "2500", stockQuantity: 100, sku: "BEV-001" },
  { name: "Bread Loaf", price: "4500", stockQuantity: 30, sku: "FOOD-001" },
  { name: "Sugar 2kg", price: "8000", stockQuantity: 20, sku: "GROC-001" },
  { name: "Cooking Oil 1L", price: "12000", stockQuantity: 15, sku: "GROC-002" },
  { name: "Milk 500ml", price: "3000", stockQuantity: 25, sku: "DAIRY-001" },
];

async function main() {
  const db = getDb();
  console.log("Seeding products…");
  for (const p of sampleProducts) {
    await db.insert(products).values({ ...p, vendorId: USER_ID! }).onConflictDoNothing();
  }
  console.log(`Done — seeded ${sampleProducts.length} products`);
}

main().catch(console.error);
