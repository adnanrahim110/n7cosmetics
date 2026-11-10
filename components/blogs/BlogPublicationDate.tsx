import { cn } from "@/lib/cn";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeZone: "Europe/London",
});

export default function BlogPublicationDate({ className, date }: { className?: string; date: Date }) {
  return (
    <time className={cn("block text-sm text-dark-700", className)} dateTime={date.toISOString()}>
      {dateFormat.format(date)}
    </time>
  );
}
