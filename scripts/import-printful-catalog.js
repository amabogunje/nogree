import { neon } from '@neondatabase/serverless';

const storeId = 18952904;
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const token = process.env.PRINTFUL_API_TOKEN;

if (!databaseUrl || !token) {
  throw new Error('DATABASE_URL and PRINTFUL_API_TOKEN must be configured.');
}

const sql = neon(databaseUrl);
const headers = {
  Authorization: `Bearer ${token}`,
  'X-PF-Store-Id': String(storeId),
};
const productsResponse = await fetch('https://api.printful.com/sync/products?limit=100', {
  headers,
});

if (!productsResponse.ok) {
  throw new Error(`Printful catalog request failed with ${productsResponse.status}.`);
}

const productList = await productsResponse.json();

function createSlug(name, syncProductId) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${syncProductId}`;
}

for (const [index, listedProduct] of (productList.result || []).entries()) {
  const response = await fetch(`https://api.printful.com/sync/products/${listedProduct.id}`, {
  headers: {
    Authorization: `Bearer ${token}`,
    'X-PF-Store-Id': String(storeId),
  },
  });

  if (!response.ok) {
    throw new Error(`Printful product request failed with ${response.status}.`);
  }

  const { result } = await response.json();
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
    description = excluded.description,
    printful_sync_product_id = excluded.printful_sync_product_id,
    printful_store_id = excluded.printful_store_id,
    image_url = excluded.image_url,
    active = excluded.active,
    display_order = excluded.display_order,
    updated_at = now()
  returning id
`;

  const productId = productRows[0].id;

  for (const variant of result.sync_variants) {
    const imageUrl = variant.files?.find((file) => file.type === 'preview')?.preview_url || variant.product?.image;
    const retailPriceCents = Math.round(Number(variant.retail_price) * 100);

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

  console.log(`Imported ${result.sync_variants.length} variants for ${productName}.`);
}
