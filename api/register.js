import { get, put } from '@vercel/blob';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const logPathname = 'registered-emails.log';

async function readCurrentLog() {
  const existingLog = await get(logPathname, {
    access: 'private',
    useCache: false,
  });

  if (!existingLog) {
    return '';
  }

  if (!existingLog.stream) {
    return '';
  }

  const response = new Response(existingLog.stream);
  return response.text();
}

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
    const entry = `${new Date().toISOString()}\t${email}\n`;
    const currentLog = await readCurrentLog();

    await put(logPathname, `${currentLog}${entry}`, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'text/plain; charset=utf-8',
    });

    response.status(200).json({
      ok: true,
    });
  } catch {
    response.status(500).json({
      error: 'Could not save registration.',
    });
  }
}
