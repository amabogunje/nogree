import { printfulRequest } from './printful.js';

const webhookTypes = ['product_synced', 'product_updated', 'product_deleted', 'stock_updated'];
const publicSiteUrl = 'https://wearnogree.com';

export async function configureCatalogWebhooks({ storeId, catalogProductIds }) {
  const secret = process.env.PRINTFUL_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error('PRINTFUL_WEBHOOK_SECRET is not configured.');
  }

  return printfulRequest('/webhooks', {
    method: 'POST',
    storeId,
    body: {
      url: `${publicSiteUrl}/api/printful/webhook?secret=${secret}`,
      types: webhookTypes,
      params: {
        stock_updated: {
          product_ids: catalogProductIds,
        },
      },
    },
  });
}
