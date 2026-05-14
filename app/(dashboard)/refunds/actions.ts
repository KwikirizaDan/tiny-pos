"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const refundSchema = z.object({
  saleId: z.string().uuid(),
  amount: z.string().min(1, "Amount is required"),
  reason: z.string().optional().nullable(),
});

export async function createRefund(data: z.infer<typeof refundSchema>) {
  const vendor = await getVendor();
  const parsed = refundSchema.parse(data);
  const supabase = await createClient();

  // Verify sale belongs to this vendor
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("*")
    .eq("id", parsed.saleId)
    .eq("vendor_id", vendor.id)
    .single();

  if (saleError || !sale) throw new Error("Sale not found");
  if (sale.status === "refunded") throw new Error("Already refunded");

  try {
    const { data: refund, error: refundError } = await supabase
      .from("refunds")
      .insert({
        sale_id: parsed.saleId,
        amount: parsed.amount,
        reason: parsed.reason,
        vendor_id: vendor.id,
        status: "processed",
      })
      .select()
      .single();

    if (refundError || !refund) throw new Error(refundError?.message || "Failed to create refund");

    const { error: updateError } = await supabase
      .from("sales")
      .update({
        status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.saleId)
      .eq("vendor_id", vendor.id);

    if (updateError) throw new Error(updateError.message);

    revalidatePath("/refunds");
    revalidatePath("/orders");
    revalidatePath("/dashboard");

    return refund;
  } catch (error: any) {
    console.error("Refund error:", error);
    throw new Error(error.message ?? "Something went wrong. Please try again.");
  }
}
