"use client";
import { useActionState, useEffect, useRef } from "react";
import { saveMetaCatalogSettings, type MetaCatalogFormState } from "@/app/admin/(dashboard)/meta/catalog-actions";
import PasswordInput from "./PasswordInput";
import MetaActionFeedback from "./MetaActionFeedback";

interface CatalogFormValues { catalogId: string; enabled: boolean; hasToken: boolean; revision: string }
const input = "mt-2 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
export default function MetaCatalogSettingsForm({ values, canEdit }: { values: CatalogFormValues; canEdit: boolean }) {
  const [state, action, pending] = useActionState<MetaCatalogFormState, FormData>(saveMetaCatalogSettings, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) {
      const token = form.current?.elements.namedItem("catalogToken");
      if (token instanceof HTMLInputElement) token.value = "";
      const clear = form.current?.elements.namedItem("clearCatalogToken");
      if (clear instanceof HTMLInputElement) clear.checked = false;
    }
  }, [state]);
  return <form ref={form} action={action} className="space-y-4">
    <input type="hidden" name="revision" value={state.revision ?? values.revision} />
    <MetaActionFeedback state={state} />
    <fieldset disabled={!canEdit || pending} className="space-y-4 disabled:opacity-75">
      <label className="flex min-h-11 items-center gap-3 text-sm text-zinc-700"><input type="checkbox" name="catalogEnabled" defaultChecked={values.enabled} className="size-4 accent-amber-800" />Enable automatic catalogue sync when credentials are ready</label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-zinc-700">Catalogue ID<input className={input} name="catalogId" defaultValue={values.catalogId} inputMode="numeric" pattern="[0-9]{5,30}|" maxLength={30} placeholder="e.g. 123456789012345" /><span className="mt-2 block text-xs font-normal leading-5 text-zinc-500">Find this in Commerce Manager → Catalogue → Settings. This is separate from the Pixel / dataset ID.</span></label>
        <div><PasswordInput name="catalogToken" label="Catalogue access token" autoComplete="new-password" maxLength={4096} hint={values.hasToken ? "Saved securely. Leave blank to keep the current token." : "Use a system-user token with permission to manage this catalogue."} /><label className="mt-3 flex min-h-11 items-center gap-2 text-xs text-zinc-600"><input name="clearCatalogToken" type="checkbox" />Remove the saved catalogue token</label></div>
      </div>
      <p className="text-xs leading-5 text-zinc-500">Changing the catalogue ID requires a token for the new catalogue. Pausing sync keeps the existing Meta items in place.</p>
      {canEdit ? <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:opacity-50">{pending ? "Saving…" : "Save catalogue connection"}</button> : <p className="text-sm text-zinc-500">Only an owner can change catalogue credentials or request sync.</p>}
    </fieldset>
  </form>;
}
