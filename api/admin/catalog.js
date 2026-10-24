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
          description,
          image_url as printful_image_url,
          hero_image_url,
          display_order,
          active
        from products
        order by display_order asc, name asc
      `;

      response.status(200).json({ products });
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
  const description = cleanOptionalText(request.body?.description, 500);
  const displayOrder = Number(request.body?.displayOrder);

  if (!Number.isInteger(id) || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 999) {
    response.status(400).json({ error: 'Enter a valid display order.' });
    return;
  }

  if (heroImageUrl && !/^https:\/\//i.test(heroImageUrl)) {
    response.status(400).json({ error: 'Hero image must use an HTTPS URL.' });
    return;
  }

  try {
    const rows = await sql`
      update products
      set
        hero_image_url = ${heroImageUrl},
        description = ${description},
        display_order = ${displayOrder},
        updated_at = now()
      where id = ${id}
      returning id, name, description, image_url as printful_image_url, hero_image_url, display_order, active
    `;

    if (rows.length === 0) {
      response.status(404).json({ error: 'Product not found.' });
      return;
    }

    response.status(200).json({ product: rows[0] });
  } catch {
    response.status(500).json({ error: 'Could not save the product.' });
  }
}
