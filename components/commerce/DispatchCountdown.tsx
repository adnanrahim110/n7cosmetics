"use client";

import {
  getDispatchStatus,
  type DispatchSchedule,
  type DispatchStatus,
} from "@/lib/commerce/dispatch";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import ProductAssuranceBox from "./product-page/ProductAssuranceBox";

export default function DispatchCountdown({
  schedule,
}: {
  schedule: DispatchSchedule | null;
}) {
  const [status, setStatus] = useState<DispatchStatus | null>(null);
  useEffect(() => {
    if (!schedule?.enabled) return;
    const update = () => setStatus(getDispatchStatus(schedule, new Date()));
    const start = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [schedule]);
  if (!schedule?.enabled)
    return (
      <ProductAssuranceBox icon={Package} title="Dispatch">
        <p>Dispatch options confirmed when you order.</p>
      </ProductAssuranceBox>
    );
  return (
    <ProductAssuranceBox icon={Package} title={status?.title ?? "Dispatch"}>
      <p>{status?.description ?? "Checking the next dispatch window…"}</p>
    </ProductAssuranceBox>
  );
}
