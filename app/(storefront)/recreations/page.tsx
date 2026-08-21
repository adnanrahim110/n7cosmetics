import CollectionPage from "@/components/collections/CollectionPage";
import { getCollectionPage } from "@/lib/commerce/collections";

export const metadata = {
  title: "Fragrance Recreations | N7 Cosmetics",
  description: "Discover the Yusuf Bhai recreation collection: 60 independent interpretations of celebrated fragrance profiles for him, her and everyone.",
};

export default async function RecreationsPage() {
  return <CollectionPage collection={await getCollectionPage("recreations")} />;
}
