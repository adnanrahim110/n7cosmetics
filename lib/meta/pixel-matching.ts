import { metaAdvancedMatching, type MetaAdvancedMatching } from "./matching";

export interface MetaPixelIdentity {
  externalId: string;
  matching: MetaAdvancedMatching;
}

interface MetaPixelMatchingDecision {
  identity: MetaPixelIdentity;
  initialize: boolean;
  userData: MetaAdvancedMatching & { external_id?: string };
}

// A changed snapshot gets a fresh Pixel document. Never replace the nonempty
// userData of an existing SDK instance or carry another buyer's hashes forward.
export function prepareMetaPixelMatching(
  previous: MetaPixelIdentity | undefined,
  externalId: string | undefined,
  value: unknown,
): MetaPixelMatchingDecision | null {
  if (!externalId || !/^[a-f0-9]{64}$/.test(externalId)) return null;
  const matching = metaAdvancedMatching(value);
  const identity = { externalId, matching };
  return {
    identity,
    initialize: !previous || previous.externalId !== externalId || JSON.stringify(previous.matching) !== JSON.stringify(matching),
    userData: { ...matching, external_id: externalId },
  };
}
