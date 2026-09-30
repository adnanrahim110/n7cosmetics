import type { getDashboardOperations } from "@/lib/admin/dashboard";
import DashboardAttention from "./DashboardAttention";
import {
  AwaitingOrderDetails,
  StockAttentionDetails,
} from "./AttentionDetails";
export default function OperationsPanel({
  operations,
  canManage,
  orderLink,
}: {
  operations: Awaited<ReturnType<typeof getDashboardOperations>>;
  canManage: boolean;
  orderLink: string;
}) {
  return (
    <section aria-labelledby="operations-heading" className="space-y-4">
      <div>
        <h2 id="operations-heading" className="font-body text-lg font-semibold">
          Needs attention
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Current operations across all dates. Stock covers active individual
          variants with inventory tracking.
        </p>
      </div>
      <DashboardAttention
        cards={[
          {
            kind: "orders",
            label: "Paid orders awaiting fulfilment",
            count: operations.awaitingFulfilment,
            details: (
              <AwaitingOrderDetails
                orders={operations.awaitingOrders}
                total={operations.awaitingFulfilment}
                orderLink={orderLink}
              />
            ),
          },
          {
            kind: "low-stock",
            label: "Low-stock variants",
            count: operations.lowStockCount,
            details: (
              <StockAttentionDetails
                items={operations.lowStock}
                total={operations.lowStockCount}
                canManage={canManage}
              />
            ),
          },
          {
            kind: "out-of-stock",
            label: "Out-of-stock variants",
            count: operations.outOfStock,
            details: (
              <StockAttentionDetails
                items={operations.outOfStockItems}
                total={operations.outOfStock}
                canManage={canManage}
                outOfStock
              />
            ),
          },
        ]}
      />
    </section>
  );
}
