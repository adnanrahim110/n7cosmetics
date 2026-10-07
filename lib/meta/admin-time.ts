export function formatMetaAdminTime(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value)) + " UK time" : "Not yet";
}
