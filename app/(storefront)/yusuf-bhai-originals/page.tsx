import CollectionPage from "@/components/collections/CollectionPage";
import { getCollectionPage } from "@/lib/commerce/collections";

export const metadata = {
  title: "Yusuf Bhai Originals | N7 Cosmetics",
  description: "Explore 21 original Yusuf Bhai fragrances across the Noble, Teeb and Deja Vu collections, available from N7 Cosmetics in the UK.",
};

export default async function YusufBhaiOriginalsPage() {
  return <CollectionPage collection={await getCollectionPage("originals")} />;
}
