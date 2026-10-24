import Stripe from 'stripe';
import { randomBytes } from 'node:crypto';
import { sql } from './db.js';
import { printfulRequest } from './printful.js';

const shippingMarkup = 1.2;

function createOrderReference() {
  return `NG-${randomBytes(5).toString('hex').toUpperCase()}`;
}

function toCents(amount) {
  return Math.ceil(Number(amount) * 100);
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 6) {
    throw new Error('Choose at least one item.');
  }

  return items.map((item) => ({
    variantId: Number(item.variantId),
    quantity: Number(item.quantity),
  })).filter((item) => Number.isInteger(item.variantId) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 10);
}

export async function getCheckoutSelection({ items, stateCode, zip }) {
  const normalizedItems = normalizeItems(items);

  if (normalizedItems.length === 0) {
    throw new Error('Choose a valid item.');
  }

  const normalizedState = String(stateCode || '').trim().toUpperCase();
  const normalizedZip = String(zip || '').trim();

  if (!/^[A-Z]{2}$/.test(normalizedState) || !/^\d{5}(?:-\d{4})?$/.test(normalizedZip)) {
    throw new Error('Enter a valid U.S. state and ZIP code.');
  }

  const variantIds = normalizedItems.map((item) => item.variantId);
  const variants = await sql`
    select
      product_variants.id,
      product_variants.printful_sync_variant_id,
      product_variants.printful_catalog_variant_id,
      product_variants.color,
      product_variants.size,
      product_variants.retail_price_cents,
      product_variants.currency,
      product_variants.available,
      product_variants.image_url,
      products.id as product_id,
      products.name as product_name,
      products.printful_store_id
    from product_variants
    join products on products.id = product_variants.product_id
    where product_variants.id = any(${variantIds}) and products.active = true
  `;

  if (variants.length !== normalizedItems.length || variants.some((variant) => !variant.available || !variant.printful_catalog_variant_id)) {
    throw new Error('One or more selected variants are unavailable.');
  }

  const quantityByVariant = new Map(normalizedItems.map((item) => [item.variantId, item.quantity]));
  const storeIds = [...new Set(variants.map((variant) => variant.printful_store_id))];

  if (storeIds.length !== 1 || !storeIds[0]) {
    throw new Error('Selected items cannot ship together.');
  }

  const rates = await printfulRequest('/shipping/rates', {
    method: 'POST',
    storeId: storeIds[0],
    body: {
      recipient: {
        country_code: 'US',
        state_code: normalizedState,
        zip: normalizedZip,
      },
      items: variants.map((variant) => ({
        variant_id: variant.printful_catalog_variant_id,
        quantity: quantityByVariant.get(Number(variant.id)),
      })),
      currency: 'USD',
      locale: 'en_US',
    },
  });

  const standardRate = rates.find((rate) => rate.id === 'STANDARD') || rates[0];

  if (!standardRate || standardRate.currency !== 'USD') {
    throw new Error('Shipping is unavailable for this address.');
  }

  const subtotalCents = variants.reduce(
    (total, variant) => total + variant.retail_price_cents * quantityByVariant.get(Number(variant.id)),
    0,
  );

  return {
    items: variants.map((variant) => ({
      ...variant,
      quantity: quantityByVariant.get(Number(variant.id)),
    })),
    shipping: {
      method: standardRate.id,
      name: standardRate.name,
      baseCents: toCents(standardRate.rate),
      chargedCents: Math.ceil(toCents(standardRate.rate) * shippingMarkup),
      minDeliveryDays: standardRate.minDeliveryDays,
      maxDeliveryDays: standardRate.maxDeliveryDays,
    },
    address: {
      stateCode: normalizedState,
      zip: normalizedZip,
    },
    subtotalCents,
    totalCents: subtotalCents + Math.ceil(toCents(standardRate.rate) * shippingMarkup),
    storeId: storeIds[0],
  };
}

export async function createCheckoutSession(selection, origin) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Stripe is not configured.');
  }

  const orderRows = await sql`
    insert into orders (
      currency,
      subtotal_cents,
      shipping_cents,
      total_cents,
      shipping_address,
      printful_shipping_method,
      public_reference
    )
    values (
      'USD',
      ${selection.subtotalCents},
      ${selection.shipping.chargedCents},
      ${selection.totalCents},
      ${JSON.stringify(selection.address)}::jsonb,
      ${selection.shipping.method},
      ${createOrderReference()}
    )
    returning id
  `;

  const orderId = orderRows[0].id;

  try {
    for (const item of selection.items) {
      await sql`
        insert into order_items (
          order_id,
          product_variant_id,
          product_name,
          variant_label,
          quantity,
          unit_price_cents,
          printful_sync_variant_id
        )
        values (
          ${orderId},
          ${item.id},
          ${item.product_name},
          ${`${item.color} / ${item.size}`},
          ${item.quantity},
          ${item.retail_price_cents},
          ${item.printful_sync_variant_id}
        )
      `;
    }

    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      line_items: selection.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product_name,
            description: `${item.color} / ${item.size}`,
            ...(item.image_url ? { images: [item.image_url] } : {}),
          },
          unit_amount: item.retail_price_cents,
        },
        quantity: item.quantity,
      })),
      shipping_options: [{
        shipping_rate_data: {
          display_name: 'Standard shipping',
          type: 'fixed_amount',
          fixed_amount: {
            amount: selection.shipping.chargedCents,
            currency: 'usd',
          },
          delivery_estimate: {
            minimum: { unit: 'business_day', value: selection.shipping.minDeliveryDays || 4 },
            maximum: { unit: 'business_day', value: selection.shipping.maxDeliveryDays || 7 },
          },
        },
      }],
      metadata: {
        nogree_order_id: String(orderId),
        printful_shipping_method: selection.shipping.method,
      },
    });

    await sql`
      update orders
      set stripe_checkout_session_id = ${session.id}, updated_at = now()
      where id = ${orderId}
    `;

    return session;
  } catch (error) {
    await sql`
      update orders
      set payment_status = 'failed', updated_at = now()
      where id = ${orderId}
    `;
    throw error;
  }
}
