"use client";

import { useEffect, useMemo } from "react";
import { updateMetaMatching } from "@/lib/meta/client";
import { checkoutMetaMatching, type MetaMatchingInput } from "@/lib/meta/matching-input";

export function useMetaCheckoutMatching({ email, phone, fullName, city, region, postalCode, countryCode }: MetaMatchingInput) {
  const profile = useMemo(() => checkoutMetaMatching({ email, phone, fullName, city, region, postalCode, countryCode }), [email, phone, fullName, city, region, postalCode, countryCode]);
  useEffect(() => {
    if (!profile) return;
    let timer: ReturnType<typeof setTimeout>;
    const synchronize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { void updateMetaMatching(profile); }, 1000);
    };
    synchronize();
    // Details entered before a choice are used only after consent is granted.
    window.addEventListener("n7:meta-ready", synchronize);
    return () => { clearTimeout(timer); window.removeEventListener("n7:meta-ready", synchronize); };
  }, [profile]);
}
