import { getSale } from "@/lib/admin/sales";
import { getCategoryById } from "@/lib/commerce/categories";
import { categoryHref } from "@/lib/commerce/category-config";
import {
  defaultCategoryPageConfiguration,
  defaultSalePageConfiguration,
  isEditableStorefrontPageSlug,
  storefrontPageDatabaseKey,
  storefrontPageDefinitions,
  storefrontSaleDatabaseKey,
  storefrontCategoryDatabaseKey,
  type StorefrontPageConfiguration,
} from "@/lib/storefront-pages/config";

export type StorefrontPageEditorTarget =
  | {
      kind: "collection";
      editorSlug: string;
      databaseKey: string;
      name: string;
      path: string;
      saleId: null;
      categoryId: null;
      defaultConfiguration: null;
    }
  | {
      kind: "sale";
      editorSlug: string;
      databaseKey: string;
      name: string;
      path: string;
      saleId: string;
      categoryId: null;
      defaultConfiguration: StorefrontPageConfiguration;
    }
  | {
      kind: "category";
      editorSlug: string;
      databaseKey: string;
      name: string;
      path: string;
      saleId: null;
      categoryId: string;
      defaultConfiguration: StorefrontPageConfiguration;
    };

export function salePageEditorSlug(saleId: string): string {
  return `sale-${saleId}`;
}

export async function resolveStorefrontPageEditorTarget(
  value: string,
): Promise<StorefrontPageEditorTarget | null> {
  if (isEditableStorefrontPageSlug(value)) {
    const definition = storefrontPageDefinitions[value];
    return {
      kind: "collection",
      editorSlug: value,
      databaseKey: storefrontPageDatabaseKey(value),
      name: definition.name,
      path: definition.path,
      saleId: null,
      categoryId: null,
      defaultConfiguration: null,
    };
  }

  const categoryId = value.match(/^category-([1-9]\d*)$/)?.[1];
  if (categoryId) {
    const category = await getCategoryById(categoryId);
    if (!category || category.collection_status === "ARCHIVED") return null;
    return {
      kind: "category", editorSlug: value,
      databaseKey: storefrontCategoryDatabaseKey(category.id),
      name: `${category.collection_name} / ${category.name}`,
      path: categoryHref(category.collection_slug, category.slug),
      saleId: null, categoryId: category.id,
      defaultConfiguration: defaultCategoryPageConfiguration(category.name, category.collection_name, category.description),
    };
  }

  const saleId = value.match(/^sale-([1-9]\d*)$/)?.[1];
  if (!saleId) return null;
  const sale = await getSale(saleId);
  if (!sale || sale.status === "ARCHIVED") return null;
  return {
    kind: "sale",
    editorSlug: value,
    databaseKey: storefrontSaleDatabaseKey(saleId),
    name: sale.name,
    path: `/sale/${sale.slug}`,
    saleId,
    categoryId: null,
    defaultConfiguration: defaultSalePageConfiguration(
      sale.name,
      sale.buy_quantity,
      sale.free_quantity,
    ),
  };
}
