import CollectionPage from "../../components/collections/CollectionPage";
import { collectionPages } from "../../content/collections";

export const metadata = {
  title: "Yusuf Bhai Originals | N7 Cosmetics",
  description: "Explore 21 original Yusuf Bhai fragrances across the Noble, Teeb and Deja Vu collections, available from N7 Cosmetics in the UK.",
};

export default function YusufBhaiOriginalsPage() {
  return <CollectionPage collection={collectionPages.originals} />;
}
