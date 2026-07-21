export function loadGoogleIdentityClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window is undefined'));
    if ((window as any).google?.accounts?.oauth2) return resolve();

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossible de charger Google Identity Services'));
    document.body.appendChild(script);
  });
}

export function requestGoogleDriveAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse: any) => {
          if (tokenResponse.error !== undefined) {
            reject(new Error(`OAuth Error: ${tokenResponse.error}`));
          } else {
            resolve(tokenResponse.access_token);
          }
        },
        error_callback: (err: any) => {
          reject(new Error(`OAuth Client Error: ${err.type || 'Unknown'}`));
        }
      });
      client.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
}

export async function uploadFileToGoogleDrive(
  accessToken: string,
  fileContent: string,
  filename: string
): Promise<void> {
  const metadata = {
    name: filename,
    mimeType: 'application/json',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Erreur lors de l'envoi sur Google Drive (${response.status}): ${errorBody}`);
  }
}
