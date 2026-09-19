# Collection categories

Categories belong to one storefront collection: N7, Yusuf Bhai Originals,
Premium Collection, or Recreations. Sales and bundles retain their dedicated
catalog flows.

## Admin workflow

1. Open **Catalog → Categories**, choose a parent collection, and save the
   category's name, slug, description, image, visibility, order, and SEO fields.
2. Use **Edit page** on the category, or open it under **Storefront → Pages**.
   Categories use the existing collection page editor for the Hero, featured
   products, Detail, and Coming Soon sections.
3. Assign products through the product editor. Select collections first; the
   category selector offers categories within those collections. Removing a
   collection also removes that collection's category selections from the form.

The server validates category membership when saving a product. Moving a category
to another collection requires all its assigned products to belong to that
collection first.

## Storefront

Category pages use `/<collection-slug>/<category-slug>`, the collection's existing
layout and visual design, and the shared product card. Collection pages show their
complete product range and links to active categories. Category pages show only
products assigned to both the category and its parent collection.

A category is public only when both it and its collection are active. Hidden
categories remain editable. Slugs are unique within a collection, and page content
is stored against the category ID so changing its name or slug preserves edits.
Active category pages are available in the admin destination picker and sitemap.

## Database migration

Run `pnpm db:migrate` when deploying this change. Migration
`016_collection_categories.sql` intentionally removes the old global categories
and product-category assignments, disables category-targeted discounts, and adds
the required parent collection and collection-scoped slug uniqueness. Products,
variants, collections, and product-collection assignments are retained.

Back up the category records and dependent assignments before applying the reset
to another database. The migration ledger prevents the reset from running again
on subsequent normal migrations. The catalog seed no longer imports the legacy
categories; new categories are created in admin.
