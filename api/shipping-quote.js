import { getCheckoutSelection } from './lib/checkout.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const selection = await getCheckoutSelection(request.body || {});

    response.status(200).json({
      subtotalCents: selection.subtotalCents,
      shippingCents: selection.shipping.chargedCents,
      totalCents: selection.totalCents,
      shippingName: selection.shipping.name,
      delivery: {
        minBusinessDays: selection.shipping.minDeliveryDays,
        maxBusinessDays: selection.shipping.maxDeliveryDays,
      },
    });
  } catch (error) {
    response.status(400).json({ error: error.message || 'Could not calculate shipping.' });
  }
}
