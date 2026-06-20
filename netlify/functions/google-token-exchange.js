export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { code, redirect_uri, code_verifier } = JSON.parse(event.body ?? '{}');

    if (!code || !redirect_uri) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing code or redirect_uri' }) };
    }

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Google credentials not configured' }) };
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    if (code_verifier) body.set('code_verifier', code_verifier);

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Google token exchange error:', data);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: data.error_description || data.error || 'Token exchange failed' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: data.id_token }),
    };
  } catch (err) {
    console.error('google-token-exchange error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
