import TikTokConnectionCheck from "./TikTokConnectionCheck";
export default function TikTokConnectionSection({ disabled, lastResult }: { disabled: boolean; lastResult: string | null }) {
  return <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6" aria-labelledby="tiktok-connection-title">
    <h2 id="tiktok-connection-title" className="font-body text-lg font-semibold text-zinc-950">Connection check</h2>
    <p className="mt-4 text-sm leading-6 text-zinc-700">Save your token and Test Events code before checking. A saved credential alone does not prove TikTok has received events.</p>
    {lastResult ? <p className="mt-4 text-sm leading-6 text-zinc-700">Last result: {lastResult}</p> : null}
    <TikTokConnectionCheck disabled={disabled} />
  </section>;
}
