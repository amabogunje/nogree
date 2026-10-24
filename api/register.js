import { sql } from './lib/db.js';

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

  try {
    await sql`
      insert into email_subscribers (email)
      values (${email})
      on conflict (email) do nothing
    `;

    response.status(200).json({
      ok: true,
    });
  } catch {
    response.status(500).json({
      error: 'Could not save registration.',
    });
  }
}
