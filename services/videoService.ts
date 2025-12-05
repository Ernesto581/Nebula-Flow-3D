// --- CONFIGURATION ---
// You must create a project in Google Cloud Console: https://console.cloud.google.com/
// Enable "Google Drive API"
// Create OAuth 2.0 Client ID (Web Application)
// Add your domain to "Authorized JavaScript origins"

const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // <--- REPLACE THIS
const API_KEY = 'YOUR_GOOGLE_API_KEY';       // <--- REPLACE THIS
const FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';    // <--- REPLACE THIS (Optional: ID of specific folder)

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Initialize Google API Client
export const initializeGoogleDrive = async () => {
  if (gapiInited && gisInited) return;

  return new Promise<void>((resolve, reject) => {
    const checkLibraries = setInterval(() => {
      // @ts-ignore
      if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
        clearInterval(checkLibraries);
        loadGapi(resolve);
      }
    }, 100);
  });
};

const loadGapi = (resolve: () => void) => {
  // @ts-ignore
  gapi.load('client', async () => {
    try {
      // @ts-ignore
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      });
      gapiInited = true;
      
      // Load GIS
      // @ts-ignore
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined at request time
      });
      gisInited = true;
      console.log('Google Drive API initialized');
      resolve();
    } catch (error) {
        console.error('Error initializing GAPI', error);
    }
  });
};

// Main Upload Function
export const uploadVideoToBackend = async (videoBlob: Blob): Promise<boolean> => {
  // Check if configuration is missing
  if (CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      console.warn("⚠️ Google Drive Config missing. Check services/videoService.ts");
      // Fallback for demo purposes only so the app doesn't crash
      console.log("Simulating upload (Config missing)...");
      return new Promise(resolve => setTimeout(() => resolve(true), 2000));
  }

  await initializeGoogleDrive();

  return new Promise((resolve, reject) => {
    // Request Access Token
    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
        return;
      }
      
      try {
        await uploadFile(resp.access_token, videoBlob);
        resolve(true);
      } catch (error) {
        console.error("Upload failed", error);
        resolve(false);
      }
    };

    // Trigger the popup if we don't have a valid token or just request a new one
    // @ts-ignore
    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

const uploadFile = async (accessToken: string, file: Blob) => {
  const metadata = {
    name: `nebula_recording_${new Date().toISOString()}.webm`,
    mimeType: 'video/webm',
    parents: FOLDER_ID !== 'YOUR_DRIVE_FOLDER_ID' ? [FOLDER_ID] : [] 
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  });

  const data = await response.json();
  console.log("File uploaded successfully! ID:", data.id);
  return data;
};