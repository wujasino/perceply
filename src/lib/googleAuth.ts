type GoogleUser = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
};

function loadGoogleSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google SDK'));
    document.head.appendChild(s);
  });
}

export async function signInWithGoogle(): Promise<GoogleUser> {
  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID not set');

  await loadGoogleSdk();

  return new Promise<GoogleUser>((resolve, reject) => {
    const google = (window as any).google;
    if (!google || !google.accounts || !google.accounts.oauth2) {
      reject(new Error('Google SDK not available'));
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (resp: any) => {
        try {
          if (resp.error) return reject(new Error(resp.error));
          const token = resp.access_token;
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) throw new Error('Failed fetching userinfo');
          const user = await res.json();
          resolve(user as GoogleUser);
        } catch (err) {
          reject(err);
        }
      },
    });

    try {
      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
}

export default signInWithGoogle;
