// Older server pages still render this component, but their feedback is now
// presented and announced by the centralized admin toast listener.
export default function Notice(_: { type?: "error" | "success"; children: React.ReactNode }) {
  return null;
}
