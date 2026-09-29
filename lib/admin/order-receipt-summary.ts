export function receiptSummary(paymentStatus: string, total: number, refunded: number, verifiedPaid: number | null, orderStatus?: string) {
  const settled = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(paymentStatus);
  const paid = verifiedPaid ?? (settled ? total : 0);
  const status = refunded > 0 ? (refunded >= paid && paid > 0 ? "REFUNDED" : "PARTIALLY_REFUNDED")
    : verifiedPaid !== null && verifiedPaid >= total && !["REFUNDED", "PARTIALLY_REFUNDED"].includes(paymentStatus) ? "PAID" : paymentStatus;
  return {
    title: paid > 0 || settled ? "RECEIPT" : "ORDER SUMMARY",
    status,
    paid,
    refunded,
    netPaid: paid - refunded,
    balance: settled || refunded > 0 || orderStatus === "CANCELLED" ? 0 : Math.max(0, total - paid),
    note: !settled && paid === 0 ? "Payment has not been confirmed. This document is not proof of payment." : null,
  };
}
