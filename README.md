# SheetMail Sender

A complete Android application for sending personalized emails from Google Sheets via Gmail API.

![SheetMail Sender](https://img.shields.io/badge/SheetMail-Sender-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.76-green)
![Firebase](https://img.shields.io/badge/Firebase-Cloud%20Functions-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Google Sign-In** - Secure authentication with OAuth 2.0
- **Google Sheets Integration** - Import contacts directly from your sheets
- **Email Templates** - Rich text editor with placeholder support
- **Campaign Management** - Create, send, and track email campaigns
- **Real-time Progress** - Monitor sending progress with live updates
- **Rate Limiting** - Respects Gmail sending limits (500/day personal, 2000/day Workspace)
- **Dark Mode** - Full dark/light theme support
- **Background Processing** - Campaigns continue even when app is minimized

## Tech Stack

### Frontend
- **React Native** (Expo) - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **Zustand** - State management
- **React Navigation** - Screen navigation

### Backend
- **Firebase Cloud Functions** - Serverless backend
- **Firestore** - NoSQL database
- **Firebase Auth** - Authentication

### APIs
- **Gmail API** - Send emails
- **Google Sheets API** - Read sheet data
- **Google Drive API** - List sheets

## Project Structure

```
sheetmail-sender/
├── frontend/                 # React Native (Expo) app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── screens/          # App screens
│   │   ├── services/         # API and Firebase services
│   │   ├── store/            # Zustand state management
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Helper functions
│   │   ├── constants/        # App constants
│   │   └── navigation/       # Navigation configuration
│   ├── App.tsx               # Main app component
│   ├── package.json          # Dependencies
│   └── app.json              # Expo configuration
│
├── backend/                  # Firebase Cloud Functions
│   ├── src/
│   │   ├── services/         # Google API services
│   │   ├── utils/            # Backend utilities
│   │   └── types/            # TypeScript types
│   ├── src/index.ts          # Cloud Functions entry
│   ├── firestore.rules       # Security rules
│   └── package.json          # Dependencies
│
└── docs/                     # Documentation
    ├── SETUP.md              # Setup instructions
    ├── TESTING.md            # Testing checklist
    └── TROUBLESHOOTING.md    # Troubleshooting guide
```

## Screenshots

| Login | Dashboard | Sheet Select |
|-------|-----------|--------------|
| ![Login](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) | ![Sheets](docs/screenshots/sheets.png) |

| Template Editor | Campaign Preview | Sending Progress |
|-----------------|------------------|------------------|
| ![Template](docs/screenshots/template.png) | ![Preview](docs/screenshots/preview.png) | ![Sending](docs/screenshots/sending.png) |

## Quick Start

### Prerequisites

- Node.js v20+
- Firebase CLI: `npm install -g firebase-tools`
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for emulator)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/sheetmail-sender.git
cd sheetmail-sender
```

### 2. Setup Backend

```bash
cd backend
npm install

# Configure Firebase
firebase login
firebase use your-project-id

# Set environment variables
firebase functions:config:set encryption.key="your-key"
firebase functions:config:set google.client_id="your-client-id"
firebase functions:config:set google.client_secret="your-client-secret"

# Deploy
npm run build
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install

# Update app.json with your Firebase and Google credentials
# Update src/services/api.ts with your Cloud Functions URL

# Start development server
npx expo start
```

### 4. Run on Android

```bash
# On emulator
Press 'a' in terminal

# On physical device
Scan QR code with Expo Go app
```

## Configuration

### Google Cloud Console

1. Create a new project
2. Enable Gmail API, Google Sheets API, Google Drive API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials (Web and Android)
5. Add SHA-1 fingerprints

### Firebase

1. Create a new Firebase project
2. Enable Authentication (Google provider)
3. Enable Firestore Database
4. Upgrade to Blaze plan (required for Cloud Functions)

See [SETUP.md](docs/SETUP.md) for detailed instructions.

## Usage

### 1. Sign In
- Open the app
- Tap "Continue with Google"
- Grant requested permissions

### 2. Create a Campaign
- Tap "New Campaign" on Dashboard
- Select a Google Sheet or paste URL
- Map columns if needed

### 3. Design Email Template
- Enter subject line with placeholders like `{Name}`
- Use the rich text editor for the body
- Insert placeholders from available columns
- Preview with sample data

### 4. Send Campaign
- Review preview of first 10 emails
- Tap "Start Campaign"
- Monitor progress in real-time
- Pause/resume as needed

### 5. Track Results
- View campaign history
- Check sent/failed counts
- See status updates in your Google Sheet

## API Reference

### Cloud Functions

| Function | Description |
|----------|-------------|
| `exchangeToken` | Exchange OAuth code for refresh token |
| `getSheets` | List user's Google Sheets |
| `getSheetData` | Read data from a sheet |
| `createCampaign` | Create a new email campaign |
| `sendCampaign` | Start sending emails |
| `pauseCampaign` | Pause active campaign |
| `resumeCampaign` | Resume paused campaign |
| `stopCampaign` | Stop campaign permanently |
| `getCampaigns` | List user's campaigns |
| `getCampaignDetails` | Get campaign with recipients |
| `sendTestEmail` | Send test email |

## Testing

See [TESTING.md](docs/TESTING.md) for comprehensive testing checklist.

```bash
# Run tests
cd frontend
npm test

# Run linter
npm run lint
```

## Troubleshooting

See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

### Quick Fixes

- **Auth Issues**: Check SHA-1 fingerprints in Google Cloud Console
- **API Errors**: Verify API keys and enabled APIs
- **Build Errors**: Clear cache with `npx expo start -c`
- **Function Errors**: Check logs with `firebase functions:log`

## Deployment

### Build for Production

```bash
cd frontend

# Build APK for testing
eas build --profile preview --platform android

# Build AAB for Play Store
eas build --profile production --platform android
```

### Publish to Play Store

1. Create Google Play Developer account
2. Create new app in Play Console
3. Upload AAB file
4. Complete store listing
5. Submit for review

## Security

- OAuth tokens are encrypted at rest
- Firestore security rules enforce user isolation
- All API calls go through authenticated Cloud Functions
- Refresh tokens never stored in app code
- Gmail sending limits enforced

## Rate Limits

| Service | Limit |
|---------|-------|
| Gmail (Personal) | 500 emails/day |
| Gmail (Workspace) | 2000 emails/day |
| App Rate | 1 email per 2 seconds |
| Retry Attempts | 3 per failed email |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/sheetmail-sender/issues)
- Email: support@sheetmail.app

## Acknowledgments

- [Expo](https://expo.dev/) for the React Native toolchain
- [Firebase](https://firebase.google.com/) for backend services
- [Google APIs](https://developers.google.com/) for email and sheets integration

---

**Built with ❤️ by the SheetMail Team**
