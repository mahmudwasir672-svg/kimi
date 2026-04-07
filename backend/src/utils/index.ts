/**
 * SheetMail Sender Backend - Utilities
 * ====================================
 * Helper functions for Cloud Functions
 */

import * as crypto from 'crypto';
import * as functions from 'firebase-functions';

// ============================================================================
// ENCRYPTION/DECRYPTION
// ============================================================================

const ENCRYPTION_KEY = functions.config().encryption?.key || process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

/**
 * Encrypt a string using AES-256-CBC
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a string using AES-256-CBC
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }
  
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
    iv
  );
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ============================================================================
// PLACEHOLDER HANDLING
// ============================================================================

const PLACEHOLDER_REGEX = /\{([^}]+)\}/g;

/**
 * Extract placeholders from a template
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.match(PLACEHOLDER_REGEX);
  if (!matches) return [];
  
  return [...new Set(matches.map((p) => p.slice(1, -1)))].filter(Boolean);
}

/**
 * Replace placeholders with actual values
 */
export function replacePlaceholders(
  template: string,
  data: Record<string, string>,
  columnMapping: Record<string, string>
): string {
  let result = template;
  
  Object.entries(columnMapping).forEach(([placeholder, columnName]) => {
    const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
    const value = data[columnName] || '';
    result = result.replace(regex, value);
  });
  
  return result;
}

// ============================================================================
// DATE/TIME UTILITIES
// ============================================================================

/**
 * Get start of day timestamp
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of day timestamp
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toISOString();
}

// ============================================================================
// RATE LIMITING
// ============================================================================

const GMAIL_DAILY_LIMIT_PERSONAL = 500;
const GMAIL_DAILY_LIMIT_WORKSPACE = 2000;

/**
 * Get daily sending limit based on account type
 */
export function getDailyLimit(isWorkspace: boolean = false): number {
  return isWorkspace ? GMAIL_DAILY_LIMIT_WORKSPACE : GMAIL_DAILY_LIMIT_PERSONAL;
}

/**
 * Calculate delay between emails (1 per 2 seconds)
 */
export function getEmailDelayMs(): number {
  return 2000;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): { success: false; error: { code: string; message: string; details?: unknown } } {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string): { success: true; data: T; message?: string } {
  return {
    success: true,
    data,
    message,
  };
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log with structured data
 */
export function logInfo(message: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    level: 'info',
    message,
    timestamp: new Date().toISOString(),
    ...data,
  }));
}

/**
 * Log error with structured data
 */
export function logError(message: string, error: Error, data?: Record<string, unknown>): void {
  console.error(JSON.stringify({
    level: 'error',
    message,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...data,
  }));
}

// ============================================================================
// SHEET UTILITIES
// ============================================================================

/**
 * Extract sheet ID from various formats
 */
export function extractSheetId(input: string): string | null {
  if (!input) return null;
  
  // If it's already just an ID
  if (/^[a-zA-Z0-9-_]+$/.test(input.trim())) {
    return input.trim();
  }
  
  // Try to extract from URL
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/spreadsheets\/e\/([a-zA-Z0-9-_]+)/,
    /key=([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Detect column type based on sample values
 */
export function detectColumnType(sampleValues: string[]): string {
  if (sampleValues.length === 0) return 'unknown';
  
  const nonEmptyValues = sampleValues.filter((v) => v && v.trim());
  if (nonEmptyValues.length === 0) return 'unknown';
  
  // Check if all values are valid emails
  const allEmails = nonEmptyValues.every((v) => isValidEmail(v));
  if (allEmails) return 'email';
  
  // Check if all values are numbers
  const allNumbers = nonEmptyValues.every((v) => !isNaN(Number(v)) && v.trim() !== '');
  if (allNumbers) return 'number';
  
  // Check if all values look like dates
  const datePatterns = [
    /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/,
    /^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/,
  ];
  const allDates = nonEmptyValues.every((v) =>
    datePatterns.some((pattern) => pattern.test(v))
  );
  if (allDates) return 'date';
  
  return 'text';
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Split array into chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// HTML SANITIZATION
// ============================================================================

/**
 * Basic HTML sanitization
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}
