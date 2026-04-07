/**
 * SheetMail Sender Backend - Google API Service
 * =============================================
 * Service for interacting with Google APIs (Gmail, Sheets, Drive)
 */

import { google, Auth, sheets_v4, gmail_v1, drive_v3 } from 'googleapis';
import * as admin from 'firebase-admin';

import { GoogleTokens, SheetInfo, SheetData, SheetColumn, EmailMessage, SendEmailResult } from '../types';
import { decrypt, encrypt, isValidEmail, detectColumnType, extractPlaceholders, delay } from '../utils';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

// ============================================================================
// OAUTH2 CLIENT
// ============================================================================

let oauth2Client: Auth.OAuth2Client | null = null;

/**
 * Get or create OAuth2 client
 */
export function getOAuth2Client(): Auth.OAuth2Client {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
  }
  return oauth2Client;
}

/**
 * Set credentials on OAuth2 client
 */
export function setCredentials(tokens: GoogleTokens): void {
  const client = getOAuth2Client();
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    scope: tokens.scope,
    token_type: tokens.token_type,
  });
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  authorizationCode: string,
  redirectUri: string
): Promise<GoogleTokens> {
  const client = getOAuth2Client();
  
  const { tokens } = await client.getToken({
    code: authorizationCode,
    redirect_uri: redirectUri,
  });
  
  if (!tokens.refresh_token) {
    throw new Error('No refresh token received. User may have already authorized this app.');
  }
  
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date!,
    scope: tokens.scope!,
    token_type: tokens.token_type!,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const client = getOAuth2Client();
  client.setCredentials({
    refresh_token: refreshToken,
  });
  
  const { credentials } = await client.refreshAccessToken();
  
  return {
    access_token: credentials.access_token!,
    refresh_token: credentials.refresh_token || refreshToken,
    expiry_date: credentials.expiry_date!,
    scope: credentials.scope!,
    token_type: credentials.token_type!,
  };
}

/**
 * Get valid access token for user
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data()!;
  const encryptedRefreshToken = userData.refreshToken;
  
  if (!encryptedRefreshToken) {
    throw new Error('No refresh token found for user');
  }
  
  const refreshToken = decrypt(encryptedRefreshToken);
  
  // Check if token needs refresh
  const tokenExpiry = userData.tokenExpiry?.toDate();
  const now = new Date();
  
  if (!tokenExpiry || tokenExpiry <= new Date(now.getTime() + 5 * 60 * 1000)) {
    // Token expires in less than 5 minutes, refresh it
    const newTokens = await refreshAccessToken(refreshToken);
    
    // Update stored tokens
    await db.collection('users').doc(userId).update({
      refreshToken: encrypt(newTokens.refresh_token),
      tokenExpiry: admin.firestore.Timestamp.fromMillis(newTokens.expiry_date),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return newTokens.access_token;
  }
  
  // Token is still valid, decrypt and return access token
  const encryptedAccessToken = userData.accessToken;
  if (encryptedAccessToken) {
    return decrypt(encryptedAccessToken);
  }
  
  // If no access token stored, refresh to get a new one
  const newTokens = await refreshAccessToken(refreshToken);
  return newTokens.access_token;
}

// ============================================================================
// GOOGLE SHEETS API
// ============================================================================

/**
 * Get Google Sheets API client
 */
export function getSheetsApi(accessToken: string): sheets_v4.Sheets {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  return google.sheets({ version: 'v4', auth });
}

/**
 * Get Google Drive API client
 */
export function getDriveApi(accessToken: string): drive_v3.Drive {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  return google.drive({ version: 'v3', auth });
}

/**
 * List user's Google Sheets
 */
export async function listSheets(accessToken: string): Promise<SheetInfo[]> {
  const drive = getDriveApi(accessToken);
  
  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: 'files(id, name, createdTime, modifiedTime, webViewLink, owners)',
    orderBy: 'modifiedTime desc',
    pageSize: 100,
  });
  
  const files = response.data.files || [];
  
  return files.map((file) => ({
    id: file.id!,
    name: file.name!,
    createdTime: file.createdTime!,
    modifiedTime: file.modifiedTime!,
    webViewLink: file.webViewLink!,
    owner: file.owners?.[0]?.displayName || 'Unknown',
  }));
}

/**
 * Get sheet data
 */
export async function getSheetData(
  accessToken: string,
  sheetId: string,
  sheetName?: string,
  rowLimit: number = 1000
): Promise<SheetData> {
  const sheets = getSheetsApi(accessToken);
  
  // Get spreadsheet metadata
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });
  
  // Use first sheet if no sheet name provided
  const targetSheetName = sheetName || spreadsheet.data.sheets?.[0]?.properties?.title || 'Sheet1';
  
  // Get sheet data
  const range = `${targetSheetName}!1:${rowLimit + 1}`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  
  const rows = response.data.values || [];
  
  if (rows.length === 0) {
    throw new Error('Sheet is empty');
  }
  
  // Extract headers
  const headers = rows[0];
  
  // Detect columns
  const columns: SheetColumn[] = headers.map((header: string, index: number) => {
    const sampleValues = rows
      .slice(1, 6)
      .map((row) => String(row[index] || ''))
      .filter(Boolean);
    
    return {
      index,
      name: header,
      type: detectColumnType(sampleValues) as SheetColumn['type'],
      sampleValues,
    };
  });
  
  // Check if status column exists
  const hasStatusColumn = headers.some(
    (h: string) => h.toLowerCase() === 'status' || h.toLowerCase() === 'email status'
  );
  
  // Process data rows
  const dataRows = rows.slice(1).map((row, rowIndex) => {
    const rowData: Record<string, string | number> = { rowNumber: rowIndex + 2 };
    headers.forEach((header: string, colIndex: number) => {
      rowData[header] = row[colIndex] || '';
    });
    return rowData;
  });
  
  return {
    sheetId,
    sheetName: targetSheetName,
    columns,
    rows: dataRows,
    totalRows: dataRows.length,
    hasStatusColumn,
  };
}

/**
 * Update sheet status column
 */
export async function updateSheetStatus(
  accessToken: string,
  sheetId: string,
  sheetName: string,
  updates: Array<{ rowNumber: number; status: string; message?: string }>
): Promise<{ updated: number; failed: number }> {
  const sheets = getSheetsApi(accessToken);
  
  // First, check if status column exists, if not create it
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });
  
  const targetSheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  );
  
  if (!targetSheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  
  // Get current headers
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!1:1`,
  });
  
  const headers = headerResponse.data.values?.[0] || [];
  let statusColumnIndex = headers.findIndex(
    (h: string) => h.toLowerCase() === 'status' || h.toLowerCase() === 'email status'
  );
  
  // Add status column if it doesn't exist
  if (statusColumnIndex === -1) {
    statusColumnIndex = headers.length;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!${columnToLetter(statusColumnIndex)}1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Email Status']],
      },
    });
  }
  
  // Prepare batch update
  const data: sheets_v4.Schema$ValueRange[] = updates.map((update) => ({
    range: `${sheetName}!${columnToLetter(statusColumnIndex)}${update.rowNumber}`,
    values: [[update.status]],
  }));
  
  // Batch update
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data,
    },
  });
  
  return { updated: updates.length, failed: 0 };
}

/**
 * Convert column index to letter (0 = A, 1 = B, etc.)
 */
function columnToLetter(column: number): string {
  let temp = column;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// ============================================================================
// GMAIL API
// ============================================================================

/**
 * Get Gmail API client
 */
export function getGmailApi(accessToken: string): gmail_v1.Gmail {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  return google.gmail({ version: 'v1', auth });
}

/**
 * Send email via Gmail API
 */
export async function sendEmail(
  accessToken: string,
  message: EmailMessage
): Promise<SendEmailResult> {
  try {
    const gmail = getGmailApi(accessToken);
    
    // Validate email
    if (!isValidEmail(message.to)) {
      return {
        success: false,
        error: 'Invalid email address',
      };
    }
    
    // Create email content
    const emailLines = [
      `To: ${message.to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${message.subject}`,
      '',
      message.body,
    ];
    
    const email = emailLines.join('\r\n');
    
    // Encode to base64
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Send email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });
    
    return {
      success: true,
      messageId: response.data.id!,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for rate limit errors
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      };
    }
    
    // Check for daily limit errors
    if (errorMessage.includes('daily limit') || errorMessage.includes('403')) {
      return {
        success: false,
        error: 'Daily sending limit reached.',
      };
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get sending limits for user
 */
export async function getSendingLimits(accessToken: string): Promise<{
  dailyLimit: number;
  sentToday: number;
  remainingToday: number;
  resetTime: Date;
}> {
  // Gmail API doesn't provide a direct way to get sending limits
  // We'll return default limits and track sent emails in Firestore
  const dailyLimit = 500; // Personal account limit
  
  // Get sent count from Firestore (implemented elsewhere)
  const sentToday = 0; // Placeholder
  
  return {
    dailyLimit,
    sentToday,
    remainingToday: dailyLimit - sentToday,
    resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
  };
}

// ============================================================================
// CAMPAIGN SENDING
// ============================================================================

interface CampaignSendOptions {
  userId: string;
  campaignId: string;
  accessToken: string;
  subject: string;
  body: string;
  columnMapping: Record<string, string>;
  emailColumn: string;
  recipients: Array<{
    rowNumber: number;
    email: string;
    [key: string]: string | number;
  }>;
  onProgress: (progress: {
    current: number;
    total: number;
    currentEmail: string;
    sentCount: number;
    failedCount: number;
  }) => void;
  onComplete: (result: { sent: number; failed: number }) => void;
  shouldStop: () => boolean;
  shouldPause: () => boolean;
}

/**
 * Send campaign emails with rate limiting
 */
export async function sendCampaignEmails(options: CampaignSendOptions): Promise<void> {
  const {
    accessToken,
    subject,
    body,
    columnMapping,
    emailColumn,
    recipients,
    onProgress,
    onComplete,
    shouldStop,
    shouldPause,
  } = options;
  
  let sentCount = 0;
  let failedCount = 0;
  const total = recipients.length;
  
  for (let i = 0; i < recipients.length; i++) {
    // Check if should stop
    if (shouldStop()) {
      break;
    }
    
    // Check if should pause
    while (shouldPause()) {
      await delay(1000);
    }
    
    const recipient = recipients[i];
    const email = recipient[emailColumn];
    
    // Skip invalid emails
    if (!isValidEmail(email)) {
      failedCount++;
      continue;
    }
    
    // Replace placeholders
    const personalizedSubject = replacePlaceholders(subject, recipient as Record<string, string>, columnMapping);
    const personalizedBody = replacePlaceholders(body, recipient as Record<string, string>, columnMapping);
    
    // Send email
    const result = await sendEmail(accessToken, {
      to: email,
      subject: personalizedSubject,
      body: personalizedBody,
      isHtml: true,
    });
    
    if (result.success) {
      sentCount++;
    } else {
      failedCount++;
      
      // If rate limited, wait before continuing
      if (result.error?.includes('Rate limit')) {
        await delay(60000); // Wait 1 minute
      }
    }
    
    // Report progress
    onProgress({
      current: i + 1,
      total,
      currentEmail: email,
      sentCount,
      failedCount,
    });
    
    // Rate limiting: 1 email per 2 seconds
    if (i < recipients.length - 1) {
      await delay(2000);
    }
  }
  
  onComplete({ sent: sentCount, failed: failedCount });
}
