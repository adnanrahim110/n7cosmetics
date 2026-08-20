import CollectionPage from "../../components/collections/CollectionPage";
import { collectionPages } from "../../content/collections";

export const metadata = {
  title: "Fragrance Recreations | N7 Cosmetics",
  description: "Discover the Yusuf Bhai recreation collection: 60 independent interpretations of celebrated fragrance profiles for him, her and everyone.",
};

export default function RecreationsPage() {
  return <CollectionPage collection={collectionPages.recreations} />;
}
