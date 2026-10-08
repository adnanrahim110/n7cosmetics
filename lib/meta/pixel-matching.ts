import { metaAdvancedMatching, metaMatchingKeys, type MetaAdvancedMatching } from "./matching";

export interface MetaPixelIdentity {
  externalId: string;
  matching: MetaAdvancedMatching;
}

interface MetaPixelMatchingDecision {
  identity: MetaPixelIdentity;
  initialize: boolean;
  userData: MetaAdvancedMatching & { external_id?: string };
}

// The Pixel SDK accepts a second init only while its existing userData is empty.
// Seeding external_id alone would prevent checkout contact data from being added.
export function prepareMetaPixelMatching(
  previous: MetaPixelIdentity | undefined,
  externalId: string | undefined,
  value: unknown,
): MetaPixelMatchingDecision | null {
  if (!externalId || !/^[a-f0-9]{64}$/.test(externalId)) return null;
  const matching = metaAdvancedMatching(value);
  if (previous && Object.keys(previous.matching).length) {
    // A nonempty SDK identity cannot be replaced by another init. Prevent stale
    // contact hashes from being attributed to a changed buyer or withdrawn profile.
    if (previous.externalId !== externalId || metaMatchingKeys.some(key => previous.matching[key] !== undefined && matching[key] !== previous.matching[key])) return null;
    return { identity: previous, initialize: false, userData: { ...previous.matching, external_id: externalId } };
  }
  const known = Boolean(matching.em || matching.ph);
  const identity = { externalId, matching: known ? matching : {} };
  return {
    identity,
    initialize: !previous || known,
    userData: known ? { ...matching, external_id: externalId } : {},
  };
}
