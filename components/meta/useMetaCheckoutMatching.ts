"use client";

import { useEffect, useMemo } from "react";
import { updateMarketingMatching } from "@/lib/marketing/client";
import { checkoutMetaMatching, type MetaMatchingInput } from "@/lib/meta/matching-input";
import { synchronizeCheckoutMatching } from "@/lib/meta/matching-sync";

export function useMetaCheckoutMatching({ email, phone, fullName, city, region, postalCode, countryCode }: MetaMatchingInput) {
  const profile = useMemo(() => checkoutMetaMatching({ email, phone, fullName, city, region, postalCode, countryCode }), [email, phone, fullName, city, region, postalCode, countryCode]);
  useEffect(() => {
    if (!profile) return;
    return synchronizeCheckoutMatching(profile, window, updateMarketingMatching);
  }, [profile]);
}
