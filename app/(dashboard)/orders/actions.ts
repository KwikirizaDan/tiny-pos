"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const orderSchema = z.object({
  cashierId: z.string().optional(),
  customerId: z.string().uuid().optional(),
  discountCode: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.string()
  })),
  paymentMethod: z.string(),
  notes: z.string().optional(),
});

export async function createOrder(data: z.infer<typeof orderSchema>) {
  const vendor = await getVendor();
  const parsed = orderSchema.parse(data);
  const supabase = await createClient();

  const { items, cashierId, customerId, discountCode, paymentMethod, notes } = parsed;

  // Verify all products belong to this vendor and get real prices
  const { data: dbProducts, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("id", items.map(i => i.productId))
    .eq("vendor_id", vendor.id);

  if (productsError || !dbProducts || dbProducts.length !== items.length) {
    throw new Error("One or more products not found");
  }

  // Calculate subtotal server-side from real DB prices
  const subtotal = items.reduce((sum, item) => {
    const p = dbProducts.find(p => p.id === item.productId)!;
    return sum + Number(p.price) * item.quantity;
  }, 0);

  // Validate and apply discount server-side
  let discountAmount = 0;
  let appliedDiscountId: string | null = null;

  if (discountCode) {
    const { data: discount } = await supabase
      .from("discounts")
      .select("*")
      .eq("code", discountCode.toUpperCase())
      .eq("vendor_id", vendor.id)
      .eq("is_active", true)
      .single();

    if (!discount) throw new Error("Invalid or inactive discount code");
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) throw new Error("Discount code has expired");
    if (discount.max_uses !== null && discount.uses_count >= discount.max_uses) throw new Error("Discount code has reached its usage limit");
    if (discount.min_order_amount !== null && subtotal < Number(discount.min_order_amount)) {
      throw new Error(`Minimum order amount of ${discount.min_order_amount} required for this discount`);
    }

    discountAmount = discount.discount_type === "percentage"
      ? (subtotal * Number(discount.value)) / 100
      : Math.min(Number(discount.value), subtotal);

    appliedDiscountId = discount.id;
  }

  const totalAmount = Math.max(0, subtotal - discountAmount);

  try {
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        vendor_id: vendor.id,
        cashier_id: cashierId ?? null,
        customer_id: customerId ?? null,
        discount_id: appliedDiscountId,
        subtotal: subtotal.toFixed(2),
        tax_amount: "0",
        discount_amount: discountAmount.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        payment_method: paymentMethod,
        notes: notes ?? null,
        status: "completed",
      })
      .select()
      .single();

    if (saleError || !sale) throw new Error(saleError?.message || "Failed to create sale");

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(items.map(item => {
        const p = dbProducts.find(p => p.id === item.productId)!;
        return {
          sale_id: sale.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: p.price,
          subtotal: (Number(p.price) * item.quantity).toFixed(2)
        };
      }));

    if (itemsError) throw new Error(itemsError.message);

    for (const item of items) {
      const { data: ok } = await supabase.rpc("decrement_stock", {
        p_id: item.productId,
        p_quantity: item.quantity,
      });
      if (ok === false) {
        throw new Error(`Insufficient stock for product: ${item.productName}`);
      }
    }

    // Increment discount usage count
    if (appliedDiscountId) {
      await supabase.rpc("increment_discount_uses", { discount_id: appliedDiscountId });
    }

    revalidatePath("/orders");
    revalidatePath("/pos");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");

    return sale;
  } catch (error: any) {
    console.error("Order error:", error);
    throw new Error(error.message ?? "Something went wrong. Please try again.");
  }
}
