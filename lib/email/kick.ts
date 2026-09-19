import { after } from "next/server";
import { processEmailQueue } from "./queue";

export function kickEmailQueue(): void {
  after(async () => { await processEmailQueue(3).catch((error) => console.error("Email delivery deferred to worker", error)); });
}
