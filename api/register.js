const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const email = String(request.body?.email || '').trim().toLowerCase();

  if (!emailPattern.test(email)) {
    response.status(400).json({ error: 'Enter a valid email address.' });
    return;
  }

  response.status(501).json({
    error:
      'Registration logging is only available on the local dev server. Vercel needs a database or form service to store emails permanently.',
  });
}
