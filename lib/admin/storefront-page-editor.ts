import { getSale } from "@/lib/admin/sales";
import {
  defaultSalePageConfiguration,
  isEditableStorefrontPageSlug,
  storefrontPageDatabaseKey,
  storefrontPageDefinitions,
  storefrontSaleDatabaseKey,
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
      defaultConfiguration: null;
    }
  | {
      kind: "sale";
      editorSlug: string;
      databaseKey: string;
      name: string;
      path: string;
      saleId: string;
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
      defaultConfiguration: null,
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
    defaultConfiguration: defaultSalePageConfiguration(
      sale.name,
      sale.buy_quantity,
      sale.free_quantity,
    ),
  };
}
