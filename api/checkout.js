import { createCheckoutSession, getCheckoutSelection } from './lib/checkout.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const selection = await getCheckoutSelection(request.body || {});
    const origin = request.headers.origin || 'https://wearnogree.com';
    const session = await createCheckoutSession(selection, origin);

    response.status(200).json({ url: session.url });
  } catch (error) {
    response.status(400).json({ error: error.message || 'Could not start checkout.' });
  }
}
