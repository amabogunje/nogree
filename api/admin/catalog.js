import crypto from 'node:crypto';
import { sql } from '../lib/db.js';

function isAuthorized(request) {
  const expected = process.env.CATALOG_ADMIN_PASSWORD;
  const supplied = request.headers['x-catalog-admin-password'];

  if (!expected || typeof supplied !== 'string') {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  return expectedBuffer.length === suppliedBuffer.length && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function cleanOptionalText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
}

export default async function handler(request, response) {
  if (!isAuthorized(request)) {
    response.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  if (request.method === 'GET') {
    try {
      const products = await sql`
        select
          id,
          name,
          hero_title,
          selector_title,
          image_url as printful_image_url,
          hero_image_url,
          display_order,
          active
        from products
        where active = true
        order by display_order asc, name asc
      `;
      const variants = await sql`
        select product_id, color, curated_image_url, image_url as printful_image_url
        from product_variants
        order by product_id, color, size
      `;
      const variantImagesByProduct = new Map();

      for (const variant of variants) {
        if (!variantImagesByProduct.has(variant.product_id)) {
          variantImagesByProduct.set(variant.product_id, new Map());
        }

        const colors = variantImagesByProduct.get(variant.product_id);
        if (!colors.has(variant.color)) {
          colors.set(variant.color, {
            color: variant.color,
            curated_image_url: variant.curated_image_url,
            printful_image_url: variant.printful_image_url,
          });
        }
      }

      response.status(200).json({
        products: products.map((product) => ({
          ...product,
          variantImages: [...(variantImagesByProduct.get(product.id)?.values() || [])],
        })),
      });
    } catch {
      response.status(500).json({ error: 'Could not load the catalog.' });
    }
    return;
  }

  if (request.method !== 'PATCH') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const id = Number(request.body?.id);
  const heroImageUrl = cleanOptionalText(request.body?.heroImageUrl, 2000);
  const heroTitle = cleanOptionalText(request.body?.heroTitle, 120);
  const selectorTitle = cleanOptionalText(request.body?.selectorTitle, 80);
  const variantImages = Array.isArray(request.body?.variantImages) ? request.body.variantImages : [];
  const displayOrder = Number(request.body?.displayOrder);

  if (!Number.isInteger(id) || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 999) {
    response.status(400).json({ error: 'Enter a valid display order.' });
    return;
  }

  if (heroImageUrl && !/^https:\/\//i.test(heroImageUrl)) {
    response.status(400).json({ error: 'Hero image must use an HTTPS URL.' });
    return;
  }

  const cleanedVariantImages = [];
  for (const variantImage of variantImages) {
    const color = cleanOptionalText(variantImage?.color, 100);
    const imageUrl = cleanOptionalText(variantImage?.imageUrl, 2000);

    if (!color) {
      response.status(400).json({ error: 'Variant color is required.' });
      return;
    }

    if (imageUrl && !/^https:\/\//i.test(imageUrl)) {
      response.status(400).json({ error: 'Variant image must use an HTTPS URL.' });
      return;
    }

    cleanedVariantImages.push({ color, imageUrl });
  }

  try {
    const rows = await sql`
      update products
      set
        hero_image_url = ${heroImageUrl},
        hero_title = ${heroTitle},
        selector_title = ${selectorTitle},
        display_order = ${displayOrder},
        updated_at = now()
      where id = ${id}
      returning id, name, hero_title, selector_title, image_url as printful_image_url, hero_image_url, display_order, active
    `;

    if (rows.length === 0) {
      response.status(404).json({ error: 'Product not found.' });
      return;
    }

    for (const variantImage of cleanedVariantImages) {
      await sql`
        update product_variants
        set curated_image_url = ${variantImage.imageUrl}, updated_at = now()
        where product_id = ${id} and color = ${variantImage.color}
      `;
    }

    const variantRows = await sql`
      select distinct on (color)
        color, curated_image_url, image_url as printful_image_url
      from product_variants
      where product_id = ${id}
      order by color, size
    `;

    response.status(200).json({ product: { ...rows[0], variantImages: variantRows } });
  } catch {
    response.status(500).json({ error: 'Could not save the product.' });
  }
}
