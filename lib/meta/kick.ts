import { after } from "next/server";
import { processMetaQueue } from "./queue";
export function kickMetaQueue(): void {
  after(async () => { await processMetaQueue(3).catch(() => console.error("Meta delivery deferred; check the Meta worker and settings.")); });
}
