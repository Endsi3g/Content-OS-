# Content OS — Integrations Guide

## Firebase Setup

### Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/) → your project
2. **Authentication** → Sign-in method → Enable Google, Email/Password
3. **Project Settings** → General → Your apps → copy config values into `.env`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

### Firebase Admin SDK (server)
1. **Project Settings** → Service Accounts → Generate new private key
2. Copy values to `.env`:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

### Firebase Storage (video uploads)
Videos are uploaded directly from the browser to Firebase Storage.

**CORS Configuration** (required for browser uploads):
```bash
# Create cors.json:
echo '[{"origin": ["http://localhost:3000", "https://your-app.railway.app"], "method": ["GET", "PUT", "POST", "DELETE"], "maxAgeSeconds": 3600}]' > cors.json

# Apply:
gsutil cors set cors.json gs://YOUR_BUCKET_NAME.appspot.com
```

Storage rules (Firebase Console → Storage → Rules):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /videos/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024 * 1024; // 5GB
    }
    match /long-videos/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 10 * 1024 * 1024 * 1024; // 10GB
    }
  }
}
```

---

## Claude AI
Used for AI Coach chat and video clip analysis.

1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Set in `.env`:
   ```
   ANTHROPIC_API_KEY=your-server-key
   VITE_ANTHROPIC_API_KEY=your-client-key
   ANTHROPIC_MODEL=claude-4-5-haiku-latest
   ```
3. For production, ensure your client key is secured or calls are routed through the backend.

---

## Google Drive Integration
OAuth 2.0 redirect-based flow. Users connect Drive from Settings.

### Setup
1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://your-app.railway.app/api/auth/google-drive/callback`
4. Enable **Google Drive API** in APIs & Services → Library
5. Set in `.env`:
   ```
   GOOGLE_DRIVE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-...
   ```

### Flow
1. User clicks "Connect Drive" in Settings
2. App calls `GET /api/auth/google-drive/url` → redirects to Google
3. Google redirects back to `/api/auth/google-drive/callback`
4. Server exchanges code for tokens, stores in `GoogleDriveToken` table
5. App can now list and import files via `/api/drive/files` and `/api/drive/import`

---

## YouTube Integration
1. Same Google Cloud Console project as Drive
2. Enable **YouTube Data API v3**
3. Set in `.env`:
   ```
   YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
   YOUTUBE_CLIENT_SECRET=GOCSPX-...
   YOUTUBE_API_KEY=AIzaSy...
   ```

---

## Metricool Analytics
1. Get API key from [Metricool Dashboard](https://metricool.com/) → Integrations
2. Set in `.env`:
   ```
   VITE_METRICOOL_API_KEY=your-key
   ```

---

## Admin Bootstrap
Set `ADMIN_EMAILS` to auto-assign admin role on first login:
```
ADMIN_EMAILS=you@gmail.com,teammate@company.com
```
