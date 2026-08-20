import CollectionPage from "../../components/collections/CollectionPage";
import { collectionPages } from "../../content/collections";

export const metadata = {
  title: "Fragrance Bundles | N7 Cosmetics",
  description: "Shop six curated N7 Cosmetics fragrance trios, bringing together signature Yusuf Bhai originals and recreation favourites.",
};

export default function BundlesPage() {
  return <CollectionPage collection={collectionPages.bundles} />;
}
