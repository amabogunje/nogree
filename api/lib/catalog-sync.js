import { sql } from './db.js';
import { printfulRequest } from './printful.js';

const defaultStoreId = 18952904;

function createSlug(name, syncProductId) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${syncProductId}`;
}

function getStoreId() {
  const storeId = Number(process.env.PRINTFUL_STORE_ID || defaultStoreId);

  if (!Number.isInteger(storeId)) {
    throw new Error('PRINTFUL_STORE_ID must be an integer.');
  }

  return storeId;
}

export async function syncPrintfulCatalog() {
  const storeId = getStoreId();
  const listedProducts = await printfulRequest('/sync/products?limit=100', { storeId });
  const activeSyncProductIds = new Set((listedProducts || []).map((product) => Number(product.id)));
  const catalogProductIds = new Set();
  const syncedProducts = [];

  for (const [index, listedProduct] of (listedProducts || []).entries()) {
    const result = await printfulRequest(`/sync/products/${listedProduct.id}`, { storeId });
    const productName = result.sync_product.name;
    const firstPreview = result.sync_variants[0]?.files?.find((file) => file.type === 'preview')?.preview_url;

    const productRows = await sql`
      insert into products (
        slug,
        name,
        description,
        printful_sync_product_id,
        printful_store_id,
        image_url,
        active,
        display_order
      )
      values (
        ${createSlug(productName, result.sync_product.id)},
        ${productName},
        ${'Drop 01. Emotional language from Lagos.'},
        ${result.sync_product.id},
        ${storeId},
        ${firstPreview ?? result.sync_product.thumbnail_url},
        true,
        ${index + 1}
      )
      on conflict (printful_sync_product_id) do update
      set
        name = excluded.name,
        printful_store_id = excluded.printful_store_id,
        image_url = excluded.image_url,
        active = excluded.active,
        updated_at = now()
      returning id
    `;

    const productId = productRows[0].id;

    // Variants absent from the latest Printful response must no longer be purchasable.
    await sql`
      update product_variants
      set available = false, updated_at = now()
      where product_id = ${productId} and available = true
    `;

    for (const variant of result.sync_variants) {
      const imageUrl = variant.files?.find((file) => file.type === 'preview')?.preview_url || variant.product?.image;
      const retailPriceCents = Math.round(Number(variant.retail_price) * 100);

      if (variant.product?.product_id) {
        catalogProductIds.add(Number(variant.product.product_id));
      }

      await sql`
        insert into product_variants (
          product_id,
          printful_sync_variant_id,
          printful_catalog_variant_id,
          sku,
          color,
          size,
          retail_price_cents,
          currency,
          available,
          image_url
        )
        values (
          ${productId},
          ${variant.id},
          ${variant.variant_id},
          ${variant.sku || null},
          ${variant.color},
          ${variant.size},
          ${retailPriceCents},
          ${variant.currency || 'USD'},
          ${variant.availability_status === 'active' && !variant.is_ignored},
          ${imageUrl || null}
        )
        on conflict (printful_sync_variant_id) do update
        set
          printful_catalog_variant_id = excluded.printful_catalog_variant_id,
          sku = excluded.sku,
          color = excluded.color,
          size = excluded.size,
          retail_price_cents = excluded.retail_price_cents,
          currency = excluded.currency,
          available = excluded.available,
          image_url = excluded.image_url,
          updated_at = now()
      `;
    }

    syncedProducts.push({ id: result.sync_product.id, name: productName, variants: result.sync_variants.length });
  }

  const currentProducts = await sql`
    select id, printful_sync_product_id
    from products
    where printful_store_id = ${storeId} and active = true
  `;

  const removedProductIds = currentProducts
    .filter((product) => !activeSyncProductIds.has(Number(product.printful_sync_product_id)))
    .map((product) => product.id);

  for (const productId of removedProductIds) {
    await sql`
      update products
      set active = false, updated_at = now()
      where id = ${productId}
    `;
  }

  return {
    storeId,
    products: syncedProducts,
    deactivatedProducts: removedProductIds.length,
    catalogProductIds: [...catalogProductIds],
  };
}
