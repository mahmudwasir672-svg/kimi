# SheetMail Sender - Setup Instructions

Complete setup guide for the SheetMail Sender system - an Android app for sending personalized emails from Google Sheets via Gmail API.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud Console Setup](#google-cloud-console-setup)
3. [Firebase Project Setup](#firebase-project-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Configuration](#frontend-configuration)
6. [Android Build Configuration](#android-build-configuration)
7. [Running the App](#running-the-app)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** (v20 or later) installed
- **npm** or **yarn** package manager
- **Firebase CLI** installed globally: `npm install -g firebase-tools`
- **Expo CLI** installed globally: `npm install -g expo-cli`
- **Android Studio** (for Android emulator/testing)
- A **Google Account** with access to Google Cloud Console

---

## Google Cloud Console Setup

### 1. Create a New Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `sheetmail-sender`
4. Click "Create"

### 2. Enable Required APIs

1. Navigate to **APIs & Services** → **Library**
2. Enable the following APIs:
   - **Gmail API** - For sending emails
   - **Google Sheets API** - For reading sheet data
   - **Google Drive API** - For listing sheets

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (or Internal if using Google Workspace)
3. Fill in the required fields:
   - **App name**: SheetMail Sender
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click "Save and Continue"
5. Add the following scopes:
   - `.../auth/gmail.send`
   - `.../auth/spreadsheets`
   - `.../auth/drive.readonly`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Add test users (your email) if using External app

### 4. Create OAuth 2.0 Credentials

#### Web Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Name: `SheetMail Web Client`
5. Add authorized redirect URIs:
   - `https://your-project.firebaseapp.com/__/auth/handler`
   - `com.yourcompany.sheetmailsender:/oauth2redirect` (for mobile)
6. Click **Create**
7. Save the **Client ID** and **Client Secret**

#### Android Client ID

1. Click **Create Credentials** → **OAuth client ID**
2. Select **Android**
3. Name: `SheetMail Android Client`
4. Package name: `com.yourcompany.sheetmailsender`
5. SHA-1 certificate fingerprint:
   ```bash
   # Get debug SHA-1
   cd ~/.android && keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For production, use your release keystore
   ```
6. Click **Create**

### 5. Get API Keys

1. Go to **APIs & Services** → **Credentials**
2. Under **API Keys**, copy the key for:
   - Google Sheets API
   - Gmail API

---

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Select your Google Cloud project (`sheetmail-sender`)
4. Enable Google Analytics (optional)
5. Click **Create project**

### 2. Enable Authentication

1. Go to **Build** → **Authentication**
2. Click **Get started**
3. Enable **Google** sign-in provider
4. Configure with your Web Client ID
5. Save

### 3. Set Up Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click **Create database**
3. Start in **production mode**
4. Choose a location close to your users
5. Click **Enable**

### 4. Upgrade to Blaze Plan (Required for Cloud Functions)

1. Go to **Settings** (gear icon) → **Usage and billing**
2. Click **Modify plan**
3. Select **Blaze** (pay as you go)
4. Complete billing setup

---

## Backend Deployment

### 1. Navigate to Backend Directory

```bash
cd sheetmail-sender/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://your-project.firebaseapp.com/__/auth/handler

# Encryption (generate a random 32-character string)
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### 4. Set Firebase Config

```bash
firebase login
firebase use your-project-id

# Set environment variables
firebase functions:config:set encryption.key="your-encryption-key"
firebase functions:config:set google.client_id="your-client-id"
firebase functions:config:set google.client_secret="your-client-secret"
```

### 5. Deploy Functions

```bash
npm run build
firebase deploy --only functions
```

### 6. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## Frontend Configuration

### 1. Navigate to Frontend Directory

```bash
cd sheetmail-sender/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Update Configuration

Edit `app.json` with your credentials:

```json
{
  "expo": {
    "extra": {
      "firebase": {
        "apiKey": "YOUR_FIREBASE_API_KEY",
        "authDomain": "your-project.firebaseapp.com",
        "projectId": "your-project",
        "storageBucket": "your-project.appspot.com",
        "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
        "appId": "YOUR_APP_ID"
      },
      "googleOAuth": {
        "webClientId": "YOUR_GOOGLE_CLIENT_ID",
        "iosClientId": "YOUR_IOS_CLIENT_ID",
        "androidClientId": "YOUR_ANDROID_CLIENT_ID"
      }
    }
  }
}
```

### 4. Update API Base URL

Edit `src/services/api.ts` and update the Cloud Functions URL:

```typescript
export const CLOUD_FUNCTIONS = {
  BASE_URL: 'https://us-central1-your-project.cloudfunctions.net',
  // ...
};
```

---

## Android Build Configuration

### 1. Generate Keystore (for Release)

```bash
keytool -genkey -v -keystore sheetmail-release.keystore -alias sheetmail -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Get SHA-1 Fingerprint

```bash
# Debug
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release
keytool -list -v -keystore sheetmail-release.keystore -alias sheetmail
```

### 3. Update Google Cloud Console

Add the SHA-1 fingerprint to your Android OAuth client ID in Google Cloud Console.

### 4. Configure EAS Build (Optional)

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Running the App

### Development Mode

```bash
# Start Expo development server
npx expo start

# Run on Android emulator
 Press 'a' in the terminal

# Run on physical device
 Scan QR code with Expo Go app
```

### Build for Testing

```bash
# Build APK for testing
eas build --profile preview --platform android

# Or using Expo
npx expo build:android -t apk
```

### Build for Production

```bash
# Build AAB for Play Store
eas build --profile production --platform android

# Or using Expo
npx expo build:android -t app-bundle
```

---

## Post-Deployment Checklist

- [ ] Firebase Functions deployed successfully
- [ ] Firestore rules deployed
- [ ] Google OAuth consent screen published (if External)
- [ ] Test user added to OAuth consent screen
- [ ] Android SHA-1 fingerprint added to Google Cloud Console
- [ ] API keys configured in frontend
- [ ] Cloud Functions URL updated in frontend
- [ ] Test sign-in flow
- [ ] Test sheet selection
- [ ] Test email template creation
- [ ] Test campaign sending

---

## Troubleshooting

### OAuth Errors

**Error: `redirect_uri_mismatch`**
- Ensure redirect URI in Google Cloud Console matches your app configuration
- For Expo, use `com.yourcompany.sheetmailsender:/oauth2redirect`

**Error: `invalid_client`**
- Check that Client ID and Client Secret are correct
- Ensure you're using the Web Client ID for server-side flow

### Firebase Errors

**Error: `Permission denied`**
- Check Firestore rules are deployed correctly
- Verify user is authenticated

**Error: `Function not found`**
- Ensure Cloud Functions are deployed
- Check function names match in frontend API calls

### Build Errors

**Error: `Could not resolve @react-native-google-signin/google-signin`**
- Run `npm install` in frontend directory
- Clear cache: `npx expo start -c`

---

## Support

For issues and questions:
- Check the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide
- Review Firebase logs: `firebase functions:log`
- Check Google Cloud Console for API errors
