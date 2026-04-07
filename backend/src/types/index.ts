/**
 * SheetMail Sender Backend - Types
 * ================================
 * Type definitions for Cloud Functions
 */

import * as functions from 'firebase-functions';

// ============================================================================
// GOOGLE API TYPES
// ============================================================================

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
  token_type: string;
}

export interface TokenExchangeRequest {
  authorizationCode: string;
  redirectUri: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  refreshToken?: string;
  tokenExpiry?: FirebaseFirestore.Timestamp;
  scopes: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// ============================================================================
// SHEET TYPES
// ============================================================================

export interface SheetInfo {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  owner: string;
}

export interface SheetColumn {
  index: number;
  name: string;
  type: 'text' | 'email' | 'number' | 'date' | 'unknown';
  sampleValues: string[];
}

export interface SheetRow {
  rowNumber: number;
  [key: string]: string | number;
}

export interface SheetData {
  sheetId: string;
  sheetName: string;
  columns: SheetColumn[];
  rows: SheetRow[];
  totalRows: number;
  hasStatusColumn: boolean;
}

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

export type CampaignStatus = 
  | 'draft' 
  | 'preview' 
  | 'sending' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'stopped';

export type EmailStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  sheetId: string;
  sheetName: string;
  sheetUrl: string;
  subject: string;
  body: string;
  columnMapping: Record<string, string>;
  emailColumn: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  progress: number;
  createdAt: FirebaseFirestore.Timestamp;
  startedAt?: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
  errorMessage?: string;
}

export interface CampaignRecipient {
  campaignId: string;
  rowNumber: number;
  email: string;
  name?: string;
  status: EmailStatus;
  sentAt?: FirebaseFirestore.Timestamp;
  errorMessage?: string;
  retryCount: number;
}

export interface CreateCampaignRequest {
  name: string;
  sheetId: string;
  sheetName: string;
  subject: string;
  body: string;
  columnMapping: Record<string, string>;
  emailColumn: string;
}

export interface SendProgress {
  current: number;
  total: number;
  percentage: number;
  currentEmail?: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  rateLimited: boolean;
  nextRetryAt?: Date;
  sentCount: number;
  failedCount: number;
}

// ============================================================================
// EMAIL TYPES
// ============================================================================

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  isHtml: boolean;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  isHtml: boolean;
  placeholders: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================================================
// FUNCTION TYPES
// ============================================================================

export type AuthenticatedCallableContext = functions.https.CallableContext & {
  auth: {
    uid: string;
    token: {
      email?: string;
      name?: string;
      picture?: string;
    };
  };
};

export type AuthenticatedRequest = functions.Request & {
  user?: {
    uid: string;
    email?: string;
  };
};

// ============================================================================
// RATE LIMITING TYPES
// ============================================================================

export interface RateLimitInfo {
  dailyLimit: number;
  sentToday: number;
  remainingToday: number;
  resetTime: Date;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}
