"use client";

import { useReducedMotion } from "motion/react";
import type { CollectionPageContent } from "../../content/collections";
import CollectionCatalog from "./CollectionCatalog";
import CollectionHero from "./CollectionHero";
import { collectionDesigns } from "./collection-config";

export default function CollectionPage({
  collection,
}: {
  collection: CollectionPageContent;
}) {
  const shouldReduceMotion = useReducedMotion();
  const design = collectionDesigns[collection.slug];

  return (
    <>
      <CollectionHero
        collection={collection}
        design={design}
        shouldReduceMotion={shouldReduceMotion}
      />
      <CollectionCatalog
        collection={collection}
        design={design}
        shouldReduceMotion={shouldReduceMotion}
      />
    </>
  );
}
