import { getCurrentAdministrator } from "@/lib/auth/session";
import { isDatabaseId } from "@/lib/admin/form";
import { getOrderReceiptData } from "@/lib/admin/order-receipt-data";
import { renderOrderReceipt } from "@/lib/admin/order-receipt-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const administrator = await getCurrentAdministrator();
  if (!administrator) return Response.json({ error: "Sign in to generate a receipt." }, { status: 401, headers });
  const { id } = await params;
  if (!isDatabaseId(id)) return Response.json({ error: "Order not found." }, { status: 404, headers });
  try {
    const data = await getOrderReceiptData(id);
    if (!data) return Response.json({ error: "Order not found." }, { status: 404, headers });
    const pdf = await renderOrderReceipt(data);
    const filename = `N7-receipt-${data.order.order_number.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    return new Response(new Uint8Array(pdf), { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"` } });
  } catch (error) {
    console.error("Receipt generation failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "The receipt could not be generated. Please try again." }, { status: 500, headers });
  }
}
