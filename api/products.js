import { sql } from './lib/db.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const rows = await sql`
      select
        products.id as product_id,
        products.slug,
        products.name,
        products.collection,
        products.description,
        products.image_url as product_image_url,
        products.display_order,
        product_variants.id as variant_id,
        product_variants.color,
        product_variants.size,
        product_variants.retail_price_cents,
        product_variants.currency,
        product_variants.available,
        product_variants.image_url as variant_image_url
      from products
      join product_variants on product_variants.product_id = products.id
      where products.active = true
      order by
        products.display_order asc,
        product_variants.color asc,
        case product_variants.size
          when 'S' then 1
          when 'M' then 2
          when 'L' then 3
          when 'XL' then 4
          when '2XL' then 5
          when '3XL' then 6
          when '4XL' then 7
          else 99
        end asc
    `;

    const products = new Map();

    for (const row of rows) {
      if (!products.has(row.product_id)) {
        products.set(row.product_id, {
          id: row.product_id,
          slug: row.slug,
          name: row.name,
          collection: row.collection,
          description: row.description,
          imageUrl: row.product_image_url,
          displayOrder: row.display_order,
          variants: [],
        });
      }

      products.get(row.product_id).variants.push({
        id: row.variant_id,
        color: row.color,
        size: row.size,
        priceCents: row.retail_price_cents,
        currency: row.currency,
        available: row.available,
        imageUrl: row.variant_image_url,
      });
    }

    response.status(200).json({ products: [...products.values()] });
  } catch {
    response.status(500).json({ error: 'Could not load the drop.' });
  }
}
