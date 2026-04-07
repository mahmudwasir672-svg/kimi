# SheetMail Sender - Troubleshooting Guide

Common issues and their solutions for the SheetMail Sender system.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Google API Issues](#google-api-issues)
3. [Firebase Issues](#firebase-issues)
4. [Campaign Sending Issues](#campaign-sending-issues)
5. [Build Issues](#build-issues)
6. [Performance Issues](#performance-issues)

---

## Authentication Issues

### Issue: "Sign in was cancelled"

**Symptoms:**
- User taps "Continue with Google"
- Immediately returns to login screen
- Error message: "Sign in was cancelled"

**Causes & Solutions:**

1. **User cancelled the sign-in flow**
   - This is expected behavior if user taps back
   - No action needed

2. **Google Play Services not available (Android)**
   ```bash
   # Check if Google Play Services is installed
   # On emulator: Update Google Play Services in SDK Manager
   # On device: Update from Play Store
   ```

3. **SHA-1 fingerprint mismatch**
   ```bash
   # Get your debug SHA-1
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Add to Google Cloud Console > Credentials > Android Client
   ```

### Issue: "Authentication failed"

**Symptoms:**
- Sign-in appears to work
- Then shows error
- User not logged in

**Causes & Solutions:**

1. **OAuth consent screen not configured**
   - Go to Google Cloud Console > APIs & Services > OAuth consent screen
   - Fill in all required fields
   - Add test users if using External app
   - Publish or keep in testing mode

2. **Wrong Client ID**
   ```javascript
   // In app.json, use WEB Client ID, not Android Client ID
   "webClientId": "703407072044-0mboq4rqclqson724aq10fb56torrraa.apps.googleusercontent.com"
   ```

3. **Missing scopes**
   ```javascript
   // Ensure these scopes are requested
   SCOPES: [
     'https://www.googleapis.com/auth/gmail.send',
     'https://www.googleapis.com/auth/spreadsheets',
     'https://www.googleapis.com/auth/drive.readonly',
   ]
   ```

### Issue: "No refresh token received"

**Symptoms:**
- Sign-in works initially
- Token exchange fails
- Error: "No refresh token received"

**Solution:**
```javascript
// In GoogleSignin.configure, ensure:
{
  offlineAccess: true,        // Required for refresh token
  forceCodeForRefreshToken: true,  // Force consent screen
}

// User may need to revoke access and sign in again:
// https://myaccount.google.com/permissions
```

---

## Google API Issues

### Issue: "Sheet not found"

**Symptoms:**
- User selects a sheet
- Error: "Sheet not found"

**Causes & Solutions:**

1. **Sheet was deleted**
   - Check if sheet still exists in Google Drive

2. **No access to sheet**
   - Ensure user has at least viewer access to the sheet
   - Sheet must be shared with the user's email

3. **Invalid sheet ID in URL**
   ```javascript
   // Verify sheet ID extraction from URL
   // Valid formats:
   // https://docs.google.com/spreadsheets/d/SHEET_ID/edit
   // https://docs.google.com/spreadsheets/d/SHEET_ID
   ```

### Issue: "Failed to get sheet data"

**Symptoms:**
- Sheet is found
- But data cannot be read

**Causes & Solutions:**

1. **Sheet is empty**
   - Add at least a header row and one data row

2. **Sheet has no data range**
   ```javascript
   // Ensure sheet has data in cells A1 onwards
   // First row should be headers
   ```

3. **API quota exceeded**
   - Check Google Cloud Console > Quotas
   - Request quota increase if needed

### Issue: "Daily sending limit reached"

**Symptoms:**
- Campaign stops mid-send
- Error about daily limit

**Limits:**
- Gmail (Personal): 500 emails/day
- Gmail (Workspace): 2000 emails/day

**Solutions:**
1. Wait 24 hours for limit to reset
2. Use a Google Workspace account for higher limits
3. Implement sending queue with delays

---

## Firebase Issues

### Issue: "Permission denied"

**Symptoms:**
- API calls fail with 403
- Error: "Missing or insufficient permissions"

**Causes & Solutions:**

1. **Firestore rules not deployed**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **User not authenticated**
   ```javascript
   // Check auth state before API calls
   const auth = getAuth();
   if (!auth.currentUser) {
     // Redirect to login
   }
   ```

3. **Wrong user ID in rules**
   ```javascript
   // In firestore.rules, ensure:
   match /campaigns/{campaignId} {
     allow read: if request.auth.uid == resource.data.userId;
   }
   ```

### Issue: "Function not found"

**Symptoms:**
- API call returns 404
- Error: "Function not found"

**Solutions:**

1. **Functions not deployed**
   ```bash
   cd backend
   npm run build
   firebase deploy --only functions
   ```

2. **Wrong function URL**
   ```javascript
   // In frontend api.ts, update:
   BASE_URL: 'https://us-central1-YOUR-PROJECT.cloudfunctions.net'
   ```

3. **Function name mismatch**
   ```javascript
   // Ensure function names match:
   // Backend: exports.exchangeToken
   // Frontend: '/exchangeToken'
   ```

### Issue: "Internal server error"

**Symptoms:**
- Cloud Function returns 500
- Generic error message

**Debugging:**

1. **Check function logs**
   ```bash
   firebase functions:log --only exchangeToken
   ```

2. **Enable detailed logging**
   ```javascript
   // In Cloud Function
   console.log('Debug:', { userId, data });
   ```

3. **Common causes:**
   - Missing environment variables
   - Unhandled promise rejection
   - Invalid JSON in request

---

## Campaign Sending Issues

### Issue: "Campaign is already running"

**Symptoms:**
- Try to start campaign
- Error: "Campaign is already sending"

**Solutions:**

1. **Check campaign status in Firestore**
   ```javascript
   // Campaign may be stuck in 'sending' state
   // Manually update:
   db.collection('campaigns').doc(campaignId).update({
     status: 'paused'
   });
   ```

2. **Previous campaign didn't complete**
   - Check progress document
   - May need to reset status

### Issue: "Failed to send email"

**Symptoms:**
- Campaign starts
- Some emails fail

**Causes & Solutions:**

1. **Invalid email address**
   ```javascript
   // Check validation in sheet
   // Ensure email column is correctly mapped
   ```

2. **Rate limiting**
   ```javascript
   // Gmail rate limit: 1 email per second
   // Our app uses: 1 email per 2 seconds
   // If still hitting limits, increase delay
   ```

3. **Recipient inbox full**
   - No solution - email will bounce
   - Check bounce notifications in Gmail

### Issue: "Progress not updating"

**Symptoms:**
- Campaign is sending
- Progress ring stuck

**Solutions:**

1. **Check Firestore listeners**
   ```javascript
   // Ensure progress subscription is active
   // Check network connection
   ```

2. **Background processing**
   ```javascript
   // App may have been backgrounded
   // Progress updates when app returns to foreground
   ```

---

## Build Issues

### Issue: "Could not resolve dependency"

**Symptoms:**
- npm install fails
- Dependency conflicts

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# For Expo specifically
npx expo install --fix
```

### Issue: "Android build fails"

**Symptoms:**
- eas build fails
- Gradle errors

**Solutions:**

```bash
# Clean build
cd android
./gradlew clean
cd ..

# Rebuild
npx expo prebuild --clean
npx expo run:android
```

### Issue: "Google Sign-In not working in release build"

**Symptoms:**
- Works in debug
- Fails in release APK/AAB

**Solutions:**

1. **Add release SHA-1**
   ```bash
   # Get release SHA-1
   keytool -list -v -keystore your-release.keystore -alias your-alias
   
   # Add to Google Cloud Console > Credentials > Android Client
   ```

2. **Verify app.json**
   ```json
   {
     "android": {
       "package": "com.yourcompany.sheetmailsender"
     }
   }
   ```

---

## Performance Issues

### Issue: "App is slow"

**Solutions:**

1. **Enable Hermes**
   ```json
   // In app.json
   {
     "jsEngine": "hermes"
   }
   ```

2. **Optimize images**
   - Use compressed images
   - Use appropriate sizes

3. **Lazy load screens**
   ```javascript
   // Use React.lazy for screens
   const HistoryScreen = React.lazy(() => import('./screens/HistoryScreen'));
   ```

### Issue: "Sheet list takes too long to load"

**Solutions:**

1. **Implement pagination**
   ```javascript
   // Load sheets in batches
   const pageSize = 20;
   ```

2. **Cache results**
   ```javascript
   // Store in AsyncStorage
   // Refresh on pull-to-refresh
   ```

3. **Add loading skeleton**
   ```javascript
   // Show placeholder UI while loading
   ```

---

## Debugging Tips

### Enable Debug Mode

```javascript
// In App.tsx
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(); // Ignore warnings

// Or specific logs
LogBox.ignoreLogs(['Warning: ...']);
```

### Check Network Requests

```bash
# Using React Native Debugger
# 1. Install: https://github.com/jhen0409/react-native-debugger
# 2. Press Ctrl+T to enable network inspect
# 3. View all API calls
```

### Firebase Emulator

```bash
# Run functions locally for debugging
cd backend
firebase emulators:start --only functions

# Update frontend to use emulator
// In api.ts
BASE_URL: 'http://localhost:5001/your-project/us-central1'
```

### View Firestore Data

1. Go to Firebase Console > Firestore Database
2. Browse collections
3. Check document data
4. Verify security rules are working

---

## Getting Help

If issues persist:

1. **Check logs:**
   ```bash
   # Frontend
   npx expo start --ios  # or --android
   
   # Backend
   firebase functions:log
   ```

2. **Review documentation:**
   - [Expo Docs](https://docs.expo.dev/)
   - [Firebase Docs](https://firebase.google.com/docs)
   - [Google APIs Docs](https://developers.google.com/apis-explorer)

3. **Community support:**
   - Stack Overflow
   - GitHub Issues
   - Firebase Community

---

## Quick Fixes Checklist

- [ ] Restart Metro bundler: `npx expo start -c`
- [ ] Clear watchman: `watchman watch-del-all`
- [ ] Reset cache: `npm start -- --reset-cache`
- [ ] Reinstall node_modules
- [ ] Check environment variables
- [ ] Verify API keys
- [ ] Test on physical device
- [ ] Check internet connection
- [ ] Update dependencies: `npm update`
- [ ] Check for breaking changes in dependencies
