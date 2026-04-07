/**
 * SheetMail Sender - API Service
 * ==============================
 * HTTP client for communicating with Firebase Cloud Functions
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { getAuth } from 'firebase/auth';

import { CLOUD_FUNCTIONS } from '@constants';
import type { ApiResponse, ApiError } from '@types';

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: CLOUD_FUNCTIONS.BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

apiClient.interceptors.request.use(
  async (config) => {
    // Add Firebase Auth token to requests
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      try {
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized - token might be expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (user) {
          // Force refresh the token
          await user.getIdToken(true);
          
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

function handleApiError(error: AxiosError<ApiResponse>): ApiError {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.code === 'ECONNABORTED') {
    return {
      code: 'TIMEOUT',
      message: 'Request timed out. Please try again.',
    };
  }
  
  if (error.code === 'ERR_NETWORK') {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred.',
  };
}

// ============================================================================
// API WRAPPER
// ============================================================================

async function apiCall<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    let response;
    
    switch (method) {
      case 'get':
        response = await apiClient.get<ApiResponse<T>>(endpoint, config);
        break;
      case 'post':
        response = await apiClient.post<ApiResponse<T>>(endpoint, data, config);
        break;
      case 'put':
        response = await apiClient.put<ApiResponse<T>>(endpoint, data, config);
        break;
      case 'delete':
        response = await apiClient.delete<ApiResponse<T>>(endpoint, config);
        break;
    }
    
    if (response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'API call failed');
  } catch (error) {
    const apiError = handleApiError(error as AxiosError<ApiResponse>);
    throw apiError;
  }
}

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authApi = {
  /**
   * Exchange authorization code for refresh token
   */
  exchangeToken: (authorizationCode: string, redirectUri: string) =>
    apiCall<{ success: boolean; message: string }>('post', '/exchangeToken', {
      authorizationCode,
      redirectUri,
    }),
  
  /**
   * Validate current token
   */
  validateToken: () =>
    apiCall<{ valid: boolean; expiresAt?: number }>('get', '/validateToken'),
  
  /**
   * Refresh access token
   */
  refreshToken: () =>
    apiCall<{ success: boolean; expiresAt: number }>('post', '/refreshToken'),
  
  /**
   * Revoke Google access
   */
  revokeAccess: () =>
    apiCall<{ success: boolean }>('post', '/revokeAccess'),
};

// ============================================================================
// GOOGLE SHEETS API
// ============================================================================

export interface SheetListItem {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  owner: string;
}

export interface SheetDataResponse {
  sheetId: string;
  sheetName: string;
  columns: Array<{
    index: number;
    name: string;
    type: string;
    sampleValues: string[];
  }>;
  rows: Array<Record<string, string | number>>;
  totalRows: number;
  hasStatusColumn: boolean;
}

export const sheetsApi = {
  /**
   * List user's Google Sheets
   */
  getSheets: (pageToken?: string, pageSize = 20) =>
    apiCall<{
      sheets: SheetListItem[];
      nextPageToken?: string;
    }>('get', '/getSheets', undefined, {
      params: { pageToken, pageSize },
    }),
  
  /**
   * Get data from a specific sheet
   */
  getSheetData: (sheetId: string, sheetName?: string, rowLimit = 1000) =>
    apiCall<SheetDataResponse>('get', '/getSheetData', undefined, {
      params: { sheetId, sheetName, rowLimit },
    }),
  
  /**
   * Update status column in sheet
   */
  updateSheetStatus: (
    sheetId: string,
    updates: Array<{ rowNumber: number; status: string; message?: string }>
  ) =>
    apiCall<{ updated: number; failed: number }>('post', '/updateSheetStatus', {
      sheetId,
      updates,
    }),
  
  /**
   * Search sheets by name
   */
  searchSheets: (query: string) =>
    apiCall<{ sheets: SheetListItem[] }>('get', '/searchSheets', undefined, {
      params: { query },
    }),
};

// ============================================================================
// CAMPAIGN API
// ============================================================================

export interface CreateCampaignRequest {
  name: string;
  sheetId: string;
  sheetName: string;
  subject: string;
  body: string;
  columnMapping: Record<string, string>;
  emailColumn: string;
}

export interface CampaignResponse {
  id: string;
  name: string;
  sheetId: string;
  sheetName: string;
  sheetUrl: string;
  subject: string;
  body: string;
  columnMapping: Record<string, string>;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CampaignDetailsResponse extends CampaignResponse {
  recipients: Array<{
    rowNumber: number;
    email: string;
    name?: string;
    status: string;
    sentAt?: string;
    errorMessage?: string;
    retryCount: number;
  }>;
  validationErrors: Array<{
    rowNumber: number;
    field: string;
    message: string;
    severity: string;
  }>;
}

export interface SendProgressResponse {
  current: number;
  total: number;
  percentage: number;
  currentEmail?: string;
  status: string;
  rateLimited: boolean;
  nextRetryAt?: string;
}

export const campaignsApi = {
  /**
   * Create a new campaign
   */
  createCampaign: (data: CreateCampaignRequest) =>
    apiCall<CampaignResponse>('post', '/createCampaign', data),
  
  /**
   * Get user's campaigns
   */
  getCampaigns: (status?: string, limit = 20, offset = 0) =>
    apiCall<{
      campaigns: CampaignResponse[];
      total: number;
      hasMore: boolean;
    }>('get', '/getCampaigns', undefined, {
      params: { status, limit, offset },
    }),
  
  /**
   * Get campaign details
   */
  getCampaignDetails: (campaignId: string) =>
    apiCall<CampaignDetailsResponse>('get', `/getCampaignDetails/${campaignId}`),
  
  /**
   * Start sending campaign
   */
  sendCampaign: (campaignId: string) =>
    apiCall<{ success: boolean; message: string }>('post', `/sendCampaign/${campaignId}`),
  
  /**
   * Pause campaign
   */
  pauseCampaign: (campaignId: string) =>
    apiCall<{ success: boolean }>('post', `/pauseCampaign/${campaignId}`),
  
  /**
   * Resume campaign
   */
  resumeCampaign: (campaignId: string) =>
    apiCall<{ success: boolean }>('post', `/resumeCampaign/${campaignId}`),
  
  /**
   * Stop campaign
   */
  stopCampaign: (campaignId: string) =>
    apiCall<{ success: boolean }>('post', `/stopCampaign/${campaignId}`),
  
  /**
   * Get send progress
   */
  getSendProgress: (campaignId: string) =>
    apiCall<SendProgressResponse>('get', `/getSendProgress/${campaignId}`),
  
  /**
   * Delete campaign
   */
  deleteCampaign: (campaignId: string) =>
    apiCall<{ success: boolean }>('delete', `/deleteCampaign/${campaignId}`),
  
  /**
   * Duplicate campaign
   */
  duplicateCampaign: (campaignId: string, newName: string) =>
    apiCall<CampaignResponse>('post', `/duplicateCampaign/${campaignId}`, { newName }),
};

// ============================================================================
// EMAIL TEMPLATE API
// ============================================================================

export interface SaveTemplateRequest {
  name: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface TemplateResponse {
  id: string;
  name: string;
  subject: string;
  body: string;
  isHtml: boolean;
  placeholders: string[];
  createdAt: string;
  updatedAt: string;
}

export const templatesApi = {
  /**
   * Get all templates
   */
  getTemplates: () =>
    apiCall<{ templates: TemplateResponse[] }>('get', '/getTemplates'),
  
  /**
   * Get single template
   */
  getTemplate: (templateId: string) =>
    apiCall<TemplateResponse>('get', `/getTemplate/${templateId}`),
  
  /**
   * Save new template
   */
  saveTemplate: (data: SaveTemplateRequest) =>
    apiCall<TemplateResponse>('post', '/saveTemplate', data),
  
  /**
   * Update template
   */
  updateTemplate: (templateId: string, data: Partial<SaveTemplateRequest>) =>
    apiCall<TemplateResponse>('put', `/updateTemplate/${templateId}`, data),
  
  /**
   * Delete template
   */
  deleteTemplate: (templateId: string) =>
    apiCall<{ success: boolean }>('delete', `/deleteTemplate/${templateId}`),
  
  /**
   * Preview template with sample data
   */
  previewTemplate: (
    templateId: string,
    sampleData: Record<string, string>
  ) =>
    apiCall<{
      subject: string;
      body: string;
    }>('post', `/previewTemplate/${templateId}`, { sampleData }),
};

// ============================================================================
// TEST EMAIL API
// ============================================================================

export interface TestEmailRequest {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export const testEmailApi = {
  /**
   * Send test email
   */
  sendTestEmail: (data: TestEmailRequest) =>
    apiCall<{ success: boolean; messageId?: string }>('post', '/sendTestEmail', data),
  
  /**
   * Send test email with template
   */
  sendTestEmailWithTemplate: (
    templateId: string,
    to: string,
    sampleData: Record<string, string>
  ) =>
    apiCall<{ success: boolean; messageId?: string }>('post', '/sendTestEmailWithTemplate', {
      templateId,
      to,
      sampleData,
    }),
};

// ============================================================================
// ANALYTICS API
// ============================================================================

export const analyticsApi = {
  /**
   * Get dashboard stats
   */
  getDashboardStats: () =>
    apiCall<{
      totalCampaigns: number;
      totalSent: number;
      totalFailed: number;
      averageSuccessRate: number;
      recentCampaigns: CampaignResponse[];
    }>('get', '/getDashboardStats'),
  
  /**
   * Get sending limits
   */
  getSendingLimits: () =>
    apiCall<{
      dailyLimit: number;
      sentToday: number;
      remainingToday: number;
      resetTime: string;
    }>('get', '/getSendingLimits'),
};

// ============================================================================
// EXPORT API CLIENT
// ============================================================================

export { apiClient };
export default apiClient;
