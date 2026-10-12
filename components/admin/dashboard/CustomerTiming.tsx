import type { TimingPattern } from "@/lib/admin/dashboard-timing";
import TimePatternPanel from "./TimePatternPanel";

export default function CustomerTiming({ timing }: { timing: TimingPattern }) {
  return <TimePatternPanel
    title="Best buying times"
    description="Average purchasing activity by weekday and hour from paid GBP orders. Customers count once per hour; repeat orders are counted separately. These figures describe buying activity."
    timing={timing}
    metrics={[{ key: "orders", label: "Paid orders" }, { key: "customers", label: "Customers" }]}
  />;
}
