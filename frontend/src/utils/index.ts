/**
 * SheetMail Sender - Utilities
 * ============================
 * Helper functions and utilities
 */

import { EMAIL_REGEX, PLACEHOLDER_PATTERNS } from '@constants';
import type { SheetColumn, SheetRow, Placeholder, ValidationError, EmailPreview } from '@types';

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

/**
 * Validates multiple email addresses
 */
export function validateEmails(emails: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach(email => {
    if (isValidEmail(email)) {
      valid.push(email.trim().toLowerCase());
    } else {
      invalid.push(email);
    }
  });

  return { valid, invalid };
}

/**
 * Extracts domain from email address
 */
export function getEmailDomain(email: string): string {
  const match = email.trim().toLowerCase().match(/@(.+)$/);
  return match ? match[1] : '';
}

// ============================================================================
// PLACEHOLDER HANDLING
// ============================================================================

/**
 * Extracts placeholders from a template string
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.match(PLACEHOLDER_PATTERNS.REGEX);
  if (!matches) return [];
  
  // Remove duplicates and clean up
  return [...new Set(matches.map(p => p.slice(1, -1)))].filter(Boolean);
}

/**
 * Replaces placeholders in a template with actual values
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

/**
 * Auto-detects column mappings based on placeholder names and column headers
 */
export function autoDetectColumnMappings(
  placeholders: string[],
  columns: SheetColumn[]
): Record<string, string> {
  const mappings: Record<string, string> = {};
  
  placeholders.forEach(placeholder => {
    const placeholderLower = placeholder.toLowerCase();
    
    // Try to find a matching column
    for (const column of columns) {
      const columnNameLower = column.name.toLowerCase();
      
      // Direct match
      if (columnNameLower === placeholderLower) {
        mappings[placeholder] = column.name;
        break;
      }
      
      // Check known mappings
      const knownMappings = PLACEHOLDER_PATTERNS.COLUMN_MAPPINGS[placeholderLower];
      if (knownMappings) {
        if (knownMappings.some(m => columnNameLower.includes(m))) {
          mappings[placeholder] = column.name;
          break;
        }
      }
      
      // Partial match
      if (columnNameLower.includes(placeholderLower) || 
          placeholderLower.includes(columnNameLower)) {
        mappings[placeholder] = column.name;
        break;
      }
    }
  });
  
  return mappings;
}

/**
 * Gets sample values for placeholders from a row
 */
export function getPlaceholderSamples(
  placeholders: string[],
  columnMapping: Record<string, string>,
  sampleRow: SheetRow
): Placeholder[] {
  return placeholders.map(name => {
    const column = columnMapping[name];
    const sampleValue = column ? String(sampleRow[column] || '') : '';
    
    return {
      name,
      column,
      sampleValue,
    };
  });
}

// ============================================================================
// SHEET DATA UTILITIES
// ============================================================================

/**
 * Extracts sheet ID from various formats (URL, ID string)
 */
export function extractSheetId(input: string): string | null {
  if (!input) return null;
  
  // If it's already just an ID (no slashes, no query params)
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
 * Detects column types based on sample values
 */
export function detectColumnType(sampleValues: string[]): SheetColumn['type'] {
  if (sampleValues.length === 0) return 'unknown';
  
  const nonEmptyValues = sampleValues.filter(v => v && v.trim());
  if (nonEmptyValues.length === 0) return 'unknown';
  
  // Check if all values are valid emails
  const allEmails = nonEmptyValues.every(v => isValidEmail(v));
  if (allEmails) return 'email';
  
  // Check if all values are numbers
  const allNumbers = nonEmptyValues.every(v => !isNaN(Number(v)) && v.trim() !== '');
  if (allNumbers) return 'number';
  
  // Check if all values look like dates
  const datePatterns = [
    /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/, // MM/DD/YYYY
    /^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/, // YYYY/MM/DD
  ];
  const allDates = nonEmptyValues.every(v => 
    datePatterns.some(pattern => pattern.test(v))
  );
  if (allDates) return 'date';
  
  return 'text';
}

/**
 * Finds the email column in sheet columns
 */
export function findEmailColumn(columns: SheetColumn[]): SheetColumn | null {
  // First, look for a column with email type
  const emailTypeColumn = columns.find(col => col.type === 'email');
  if (emailTypeColumn) return emailTypeColumn;
  
  // Then, look for column names that suggest email
  const emailKeywords = ['email', 'e-mail', 'mail', 'email address'];
  const namedColumn = columns.find(col => 
    emailKeywords.some(keyword => col.name.toLowerCase().includes(keyword))
  );
  if (namedColumn) return namedColumn;
  
  return null;
}

/**
 * Validates sheet data for email campaign
 */
export function validateSheetData(
  rows: SheetRow[],
  columns: SheetColumn[],
  emailColumnName: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because row 1 is header
    const email = String(row[emailColumnName] || '').trim();
    
    // Check if email is present
    if (!email) {
      errors.push({
        rowNumber,
        field: emailColumnName,
        message: 'Email address is missing',
        severity: 'error',
      });
      return;
    }
    
    // Check if email is valid
    if (!isValidEmail(email)) {
      errors.push({
        rowNumber,
        field: emailColumnName,
        message: `Invalid email address: "${email}"`,
        severity: 'error',
      });
    }
  });
  
  return errors;
}

// ============================================================================
// TEMPLATE UTILITIES
// ============================================================================

/**
 * Generates email preview from template and row data
 */
export function generateEmailPreview(
  subject: string,
  body: string,
  row: SheetRow,
  columnMapping: Record<string, string>
): EmailPreview {
  const emailColumn = Object.values(columnMapping).find(col => 
    col.toLowerCase().includes('email')
  ) || 'Email';
  
  return {
    to: String(row[emailColumn] || ''),
    subject: replacePlaceholders(subject, row, columnMapping),
    body: replacePlaceholders(body, row, columnMapping),
    originalRow: row,
  };
}

/**
 * Escapes HTML special characters
 */
export function escapeHtml(text: string): string {
  const div = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => div[m as keyof typeof div]);
}

/**
 * Sanitizes HTML content for display
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - remove script tags and event handlers
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Formats a number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Formats a percentage
 */
export function formatPercentage(num: number, decimals = 1): string {
  return `${num.toFixed(decimals)}%`;
}

/**
 * Formats a date
 */
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return d.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Formats a date with time
 */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Truncates text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Chunks an array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Removes duplicates from an array
 */
export function uniqueArray<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Groups array items by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// ============================================================================
// DELAY & RETRY UTILITIES
// ============================================================================

/**
 * Creates a delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }
  
  throw lastError;
}

// ============================================================================
// DEBOUNCE & THROTTLE
// ============================================================================

/**
 * Debounces a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttles a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Safely parses JSON
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely stringifies JSON
 */
export function safeJsonStringify(obj: unknown, defaultValue = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
}
