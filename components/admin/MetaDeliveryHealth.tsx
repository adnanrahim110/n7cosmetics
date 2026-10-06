import { getMetaDeliveryHealth } from "@/lib/meta/delivery-health";
import MetaDeliveryStatus from "./MetaDeliveryStatus";

export default async function MetaDeliveryHealth() {
  const summary = await getMetaDeliveryHealth();
  return <MetaDeliveryStatus key={summary.worker.seenAt} initial={summary} />;
}
