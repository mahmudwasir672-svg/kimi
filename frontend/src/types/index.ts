/**
 * SheetMail Sender - Type Definitions
 * ===================================
 * Central type definitions for the entire application
 */

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  hasGmailAccess: boolean;
  hasSheetsAccess: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface GoogleCredentials {
  accessToken: string;
  idToken: string;
  authorizationCode?: string;
}

// ============================================================================
// GOOGLE SHEETS TYPES
// ============================================================================

export interface GoogleSheet {
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

export interface ColumnMapping {
  [placeholder: string]: string; // placeholder name -> column name
}

// ============================================================================
// EMAIL TEMPLATE TYPES
// ============================================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isHtml: boolean;
  placeholders: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Placeholder {
  name: string;
  column: string | null;
  sampleValue: string;
}

export interface EmailPreview {
  to: string;
  subject: string;
  body: string;
  originalRow: SheetRow;
}

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

export type CampaignStatus = 'draft' | 'preview' | 'sending' | 'paused' | 'completed' | 'failed';
export type EmailStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  sheetId: string;
  sheetName: string;
  sheetUrl: string;
  templateId: string;
  templateName: string;
  subject: string;
  body: string;
  columnMapping: ColumnMapping;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface CampaignRecipient {
  rowNumber: number;
  email: string;
  name?: string;
  status: EmailStatus;
  sentAt?: Date;
  errorMessage?: string;
  retryCount: number;
}

export interface CampaignDetails extends Campaign {
  recipients: CampaignRecipient[];
  validationErrors: ValidationError[];
}

export interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SendProgress {
  current: number;
  total: number;
  percentage: number;
  currentEmail?: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  rateLimited: boolean;
  nextRetryAt?: Date;
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// FIRESTORE TYPES
// ============================================================================

export interface FirestoreUser {
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

export interface FirestoreCampaign {
  id: string;
  userId: string;
  name: string;
  sheetId: string;
  sheetName: string;
  sheetUrl: string;
  subject: string;
  body: string;
  columnMapping: Record<string, string>;
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

export interface FirestoreRecipient {
  campaignId: string;
  rowNumber: number;
  email: string;
  name?: string;
  status: EmailStatus;
  sentAt?: FirebaseFirestore.Timestamp;
  errorMessage?: string;
  retryCount: number;
}

// ============================================================================
// UI/UX TYPES
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

export interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  text1: string;
  text2?: string;
  visibilityTime?: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

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

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

export interface RateLimitConfig {
  maxRequestsPerSecond: number;
  maxRequestsPerDay: number;
}
