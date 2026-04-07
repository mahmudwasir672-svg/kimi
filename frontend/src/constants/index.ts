/**
 * SheetMail Sender - Constants
 * ============================
 * Application-wide constants and configuration
 */

import Constants from 'expo-constants';

// ============================================================================
// GOOGLE API CONFIGURATION
// ============================================================================

export const GOOGLE_CONFIG = {
  // OAuth 2.0 Client IDs
  WEB_CLIENT_ID: Constants.expoConfig?.extra?.googleOAuth?.webClientId || 
    '703407072044-0mboq4rqclqson724aq10fb56torrraa.apps.googleusercontent.com',
  IOS_CLIENT_ID: Constants.expoConfig?.extra?.googleOAuth?.iosClientId || 
    '703407072044-0mboq4rqclqson724aq10fb56torrraa.apps.googleusercontent.com',
  ANDROID_CLIENT_ID: Constants.expoConfig?.extra?.googleOAuth?.androidClientId || '',
  
  // API Keys
  SHEETS_API_KEY: 'YOUR_SHEETS_API_KEY',
  GMAIL_API_KEY: 'YOUR_GMAIL_API_KEY',
  
  // OAuth Scopes
  SCOPES: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  
  // API Endpoints
  TOKEN_ENDPOINT: 'https://oauth2.googleapis.com/token',
  AUTH_ENDPOINT: 'https://accounts.google.com/o/oauth2/v2/auth',
  REVOKE_ENDPOINT: 'https://oauth2.googleapis.com/revoke',
  
  // Gmail Limits
  GMAIL_DAILY_LIMIT_PERSONAL: 500,
  GMAIL_DAILY_LIMIT_WORKSPACE: 2000,
  GMAIL_RATE_LIMIT_PER_SECOND: 1,
};

// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================

export const FIREBASE_CONFIG = {
  apiKey: Constants.expoConfig?.extra?.firebase?.apiKey || '',
  authDomain: Constants.expoConfig?.extra?.firebase?.authDomain || '',
  projectId: Constants.expoConfig?.extra?.firebase?.projectId || '',
  storageBucket: Constants.expoConfig?.extra?.firebase?.storageBucket || '',
  messagingSenderId: Constants.expoConfig?.extra?.firebase?.messagingSenderId || '',
  appId: Constants.expoConfig?.extra?.firebase?.appId || '',
};

// ============================================================================
// CLOUD FUNCTION ENDPOINTS
// ============================================================================

export const CLOUD_FUNCTIONS = {
  // Base URL will be set after Firebase deployment
  BASE_URL: '', // e.g., 'https://us-central1-your-project.cloudfunctions.net'
  
  ENDPOINTS: {
    EXCHANGE_TOKEN: 'exchangeToken',
    GET_SHEETS: 'getSheets',
    GET_SHEET_DATA: 'getSheetData',
    SEND_CAMPAIGN: 'sendCampaign',
    UPDATE_SHEET_STATUS: 'updateSheetStatus',
    GET_CAMPAIGNS: 'getCampaigns',
    GET_CAMPAIGN_DETAILS: 'getCampaignDetails',
    PAUSE_CAMPAIGN: 'pauseCampaign',
    RESUME_CAMPAIGN: 'resumeCampaign',
    STOP_CAMPAIGN: 'stopCampaign',
    REFRESH_TOKEN: 'refreshToken',
    VALIDATE_TOKEN: 'validateToken',
  },
};

// ============================================================================
// APP CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
  // App Info
  NAME: 'SheetMail Sender',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@sheetmail.app',
  
  // Rate Limiting
  EMAIL_SEND_INTERVAL_MS: 2000, // 1 email per 2 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Preview
  PREVIEW_ROW_COUNT: 10,
  MAX_PREVIEW_ROWS: 50,
  
  // Campaign
  MAX_CAMPAIGN_NAME_LENGTH: 100,
  MAX_SUBJECT_LENGTH: 998, // RFC 2822 limit
  MAX_EMAIL_BODY_LENGTH: 1024 * 1024, // 1MB
  
  // Storage Keys
  STORAGE_KEYS: {
    USER: '@sheetmail_user',
    TOKENS: '@sheetmail_tokens',
    THEME: '@sheetmail_theme',
    ONBOARDING_COMPLETE: '@sheetmail_onboarding_complete',
    LAST_CAMPAIGN_ID: '@sheetmail_last_campaign_id',
  },
};

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const COLORS = {
  // Primary
  PRIMARY: '#3B82F6',
  PRIMARY_DARK: '#2563EB',
  PRIMARY_LIGHT: '#60A5FA',
  PRIMARY_50: '#EFF6FF',
  
  // Secondary
  SECONDARY: '#64748B',
  SECONDARY_DARK: '#475569',
  SECONDARY_LIGHT: '#94A3B8',
  
  // Success
  SUCCESS: '#10B981',
  SUCCESS_DARK: '#059669',
  SUCCESS_LIGHT: '#34D399',
  SUCCESS_50: '#ECFDF5',
  
  // Warning
  WARNING: '#F59E0B',
  WARNING_DARK: '#D97706',
  WARNING_LIGHT: '#FBBF24',
  WARNING_50: '#FFFBEB',
  
  // Error
  ERROR: '#EF4444',
  ERROR_DARK: '#DC2626',
  ERROR_LIGHT: '#F87171',
  ERROR_50: '#FEF2F2',
  
  // Info
  INFO: '#3B82F6',
  INFO_DARK: '#2563EB',
  INFO_LIGHT: '#60A5FA',
  INFO_50: '#EFF6FF',
  
  // Neutral (Light Mode)
  LIGHT_BACKGROUND: '#FFFFFF',
  LIGHT_SURFACE: '#F8FAFC',
  LIGHT_BORDER: '#E2E8F0',
  LIGHT_TEXT_PRIMARY: '#0F172A',
  LIGHT_TEXT_SECONDARY: '#64748B',
  LIGHT_TEXT_TERTIARY: '#94A3B8',
  
  // Neutral (Dark Mode)
  DARK_BACKGROUND: '#0F172A',
  DARK_SURFACE: '#1E293B',
  DARK_BORDER: '#334155',
  DARK_TEXT_PRIMARY: '#F8FAFC',
  DARK_TEXT_SECONDARY: '#CBD5E1',
  DARK_TEXT_TERTIARY: '#64748B',
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

export const FONTS = {
  SIZES: {
    XS: 10,
    SM: 12,
    MD: 14,
    LG: 16,
    XL: 18,
    XXL: 20,
    XXXL: 24,
    DISPLAY: 32,
  },
  WEIGHTS: {
    REGULAR: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
  },
  FAMILIES: {
    SANS: 'System',
    MONO: 'Courier',
  },
};

export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  XXL: 24,
  FULL: 9999,
};

export const SHADOWS = {
  SM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  MD: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  LG: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // Auth Errors
  AUTH_CANCELLED: 'Sign in was cancelled',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  AUTH_NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_INVALID_CREDENTIALS: 'Invalid credentials. Please try again.',
  AUTH_TOKEN_EXPIRED: 'Session expired. Please sign in again.',
  AUTH_INSUFFICIENT_SCOPE: 'Additional permissions required.',
  
  // Sheet Errors
  SHEET_NOT_FOUND: 'Sheet not found. Please check the URL or ID.',
  SHEET_NO_ACCESS: 'No access to this sheet. Please check permissions.',
  SHEET_EMPTY: 'Sheet is empty. Please add some data.',
  SHEET_NO_EMAIL_COLUMN: 'No email column found. Please check your sheet.',
  SHEET_INVALID_DATA: 'Invalid data in sheet. Please check and try again.',
  
  // Email Errors
  EMAIL_INVALID: 'Invalid email address.',
  EMAIL_SEND_FAILED: 'Failed to send email. Please try again.',
  EMAIL_RATE_LIMITED: 'Rate limit reached. Please wait before sending more.',
  EMAIL_DAILY_LIMIT: 'Daily sending limit reached.',
  
  // Campaign Errors
  CAMPAIGN_NOT_FOUND: 'Campaign not found.',
  CAMPAIGN_ALREADY_RUNNING: 'Campaign is already running.',
  CAMPAIGN_NO_RECIPIENTS: 'No recipients found for this campaign.',
  
  // General Errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  AUTH_SUCCESS: 'Successfully signed in!',
  SHEET_LOADED: 'Sheet loaded successfully!',
  TEMPLATE_SAVED: 'Template saved successfully!',
  EMAIL_SENT: 'Email sent successfully!',
  CAMPAIGN_CREATED: 'Campaign created successfully!',
  CAMPAIGN_STARTED: 'Campaign started!',
  CAMPAIGN_PAUSED: 'Campaign paused.',
  CAMPAIGN_RESUMED: 'Campaign resumed!',
  CAMPAIGN_COMPLETED: 'Campaign completed!',
  SETTINGS_SAVED: 'Settings saved successfully!',
};

// ============================================================================
// PLACEHOLDER PATTERNS
// ============================================================================

export const PLACEHOLDER_PATTERNS = {
  // Regex to match placeholders like {Name}, {Email}, etc.
  REGEX: /\{([^}]+)\}/g,
  
  // Common column names that map to placeholders
  COLUMN_MAPPINGS: {
    'name': ['name', 'full name', 'first name', 'firstname', 'last name', 'lastname', 'contact name', 'recipient name'],
    'email': ['email', 'e-mail', 'email address', 'e-mail address', 'mail', 'contact email'],
    'company': ['company', 'company name', 'organization', 'org', 'business', 'business name'],
    'title': ['title', 'job title', 'position', 'role', 'designation'],
    'phone': ['phone', 'phone number', 'telephone', 'mobile', 'cell', 'contact number'],
    'website': ['website', 'url', 'site', 'web', 'company website'],
    'address': ['address', 'location', 'city', 'state', 'country', 'zip', 'postal code'],
  },
};

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const DISALLOWED_EMAIL_DOMAINS = [
  'tempmail.com',
  'throwaway.com',
  'fakeemail.com',
];
