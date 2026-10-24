import { neon } from '@neondatabase/serverless';
import { configureCatalogWebhooks } from '../api/lib/printful-webhooks.js';

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

const sql = neon(databaseUrl);
const rows = await sql`
  select printful_store_id, array_agg(printful_sync_product_id order by id) as product_ids
  from products
  where active = true and printful_store_id is not null and printful_sync_product_id is not null
  group by printful_store_id
`;

for (const row of rows) {
  await configureCatalogWebhooks({
    storeId: row.printful_store_id,
    catalogProductIds: row.product_ids,
  });
}

console.log(`Configured Printful webhooks for ${rows.length} store(s).`);
