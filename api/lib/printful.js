const printfulBaseUrl = 'https://api.printful.com';

export async function printfulRequest(path, { storeId, method = 'GET', body } = {}) {
  const token = process.env.PRINTFUL_API_TOKEN;

  if (!token) {
    throw new Error('PRINTFUL_API_TOKEN is not configured.');
  }

  const response = await fetch(`${printfulBaseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(storeId ? { 'X-PF-Store-Id': String(storeId) } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.result || 'Printful request failed.');
  }

  return payload.result;
}
