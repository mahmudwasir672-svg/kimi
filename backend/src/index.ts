/**
 * SheetMail Sender Backend - Cloud Functions
 * ==========================================
 * Main entry point for Firebase Cloud Functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import {
  exchangeCodeForTokens,
  refreshAccessToken,
  listSheets,
  getSheetData,
  updateSheetStatus,
  sendEmail,
  getValidAccessToken,
  sendCampaignEmails,
} from './services/google';

import {
  encrypt,
  decrypt,
  createErrorResponse,
  createSuccessResponse,
  extractSheetId,
  isValidEmail,
  extractPlaceholders,
} from './utils';

import {
  GoogleTokens,
  Campaign,
  CampaignRecipient,
  CreateCampaignRequest,
  SendProgress,
} from './types';

// ============================================================================
// INITIALIZE FIREBASE ADMIN
// ============================================================================

admin.initializeApp();
const db = admin.firestore();

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Verify Firebase Auth token
 */
async function verifyAuth(context: functions.https.CallableContext): Promise<string> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  return context.auth.uid;
}

// ============================================================================
// TOKEN FUNCTIONS
// ============================================================================

/**
 * Exchange authorization code for refresh token
 */
export const exchangeToken = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const { authorizationCode, redirectUri } = data;
    
    if (!authorizationCode || !redirectUri) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Authorization code and redirect URI are required'
      );
    }
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(authorizationCode, redirectUri);
    
    // Store encrypted refresh token in Firestore
    await db.collection('users').doc(userId).set(
      {
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiry: admin.firestore.Timestamp.fromMillis(tokens.expiry_date),
        scopes: tokens.scope.split(' '),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    
    return createSuccessResponse({
      success: true,
      message: 'Token exchanged successfully',
    });
  } catch (error) {
    console.error('exchangeToken error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to exchange token'
    );
  }
});

/**
 * Validate user's token
 */
export const validateToken = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return createSuccessResponse({ valid: false });
    }
    
    const userData = userDoc.data()!;
    const hasRefreshToken = !!userData.refreshToken;
    
    return createSuccessResponse({
      valid: hasRefreshToken,
      expiresAt: userData.tokenExpiry?.toMillis(),
    });
  } catch (error) {
    console.error('validateToken error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to validate token'
    );
  }
});

/**
 * Refresh access token
 */
export const refreshToken = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists || !userDoc.data()?.refreshToken) {
      throw new functions.https.HttpsError('not-found', 'No refresh token found');
    }
    
    const encryptedRefreshToken = userDoc.data()!.refreshToken;
    const refreshToken = decrypt(encryptedRefreshToken);
    
    const newTokens = await refreshAccessToken(refreshToken);
    
    // Update stored token
    await db.collection('users').doc(userId).update({
      refreshToken: encrypt(newTokens.refresh_token),
      tokenExpiry: admin.firestore.Timestamp.fromMillis(newTokens.expiry_date),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return createSuccessResponse({
      success: true,
      expiresAt: newTokens.expiry_date,
    });
  } catch (error) {
    console.error('refreshToken error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to refresh token'
    );
  }
});

// ============================================================================
// SHEETS FUNCTIONS
// ============================================================================

/**
 * Get user's Google Sheets
 */
export const getSheets = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const accessToken = await getValidAccessToken(userId);
    
    const sheets = await listSheets(accessToken);
    
    return createSuccessResponse({ sheets });
  } catch (error) {
    console.error('getSheets error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to get sheets'
    );
  }
});

/**
 * Get sheet data
 */
export const getSheetData = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const { sheetId, sheetName, rowLimit = 1000 } = data;
    
    if (!sheetId) {
      throw new functions.https.HttpsError('invalid-argument', 'Sheet ID is required');
    }
    
    const accessToken = await getValidAccessToken(userId);
    const sheetData = await getSheetData(accessToken, sheetId, sheetName, rowLimit);
    
    return createSuccessResponse(sheetData);
  } catch (error) {
    console.error('getSheetData error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to get sheet data'
    );
  }
});

/**
 * Update sheet status column
 */
export const updateSheetStatus = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const { sheetId, sheetName, updates } = data;
    
    if (!sheetId || !updates || !Array.isArray(updates)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Sheet ID and updates array are required'
      );
    }
    
    const accessToken = await getValidAccessToken(userId);
    const result = await updateSheetStatus(accessToken, sheetId, sheetName || 'Sheet1', updates);
    
    return createSuccessResponse(result);
  } catch (error) {
    console.error('updateSheetStatus error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to update sheet status'
    );
  }
});

// ============================================================================
// CAMPAIGN FUNCTIONS
// ============================================================================

/**
 * Create a new campaign
 */
export const createCampaign = functions.https.onCall(async (data: CreateCampaignRequest, context) => {
  try {
    const userId = await verifyAuth(context);
    
    const { name, sheetId, sheetName, subject, body, columnMapping, emailColumn } = data;
    
    if (!name || !sheetId || !subject || !body || !emailColumn) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Name, sheetId, subject, body, and emailColumn are required'
      );
    }
    
    // Get sheet data to count recipients
    const accessToken = await getValidAccessToken(userId);
    const sheetData = await getSheetData(accessToken, sheetId, sheetName);
    
    // Create campaign document
    const campaignRef = db.collection('campaigns').doc();
    const campaign: Omit<Campaign, 'id'> = {
      userId,
      name,
      sheetId,
      sheetName: sheetName || sheetData.sheetName,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
      subject,
      body,
      columnMapping: columnMapping || {},
      emailColumn,
      status: 'draft',
      totalRecipients: sheetData.totalRows,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      progress: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    };
    
    await campaignRef.set(campaign);
    
    // Create recipient documents
    const batch = db.batch();
    sheetData.rows.forEach((row) => {
      const recipientRef = campaignRef.collection('recipients').doc();
      const recipient: Omit<CampaignRecipient, 'campaignId'> = {
        rowNumber: row.rowNumber as number,
        email: String(row[emailColumn] || ''),
        name: String(row[columnMapping?.Name || 'Name'] || ''),
        status: 'pending',
        retryCount: 0,
      };
      batch.set(recipientRef, recipient);
    });
    await batch.commit();
    
    return createSuccessResponse({
      id: campaignRef.id,
      ...campaign,
    });
  } catch (error) {
    console.error('createCampaign error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to create campaign'
    );
  }
});

/**
 * Get user's campaigns
 */
export const getCampaigns = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const { status, limit = 20, offset = 0 } = data;
    
    let query = db.collection('campaigns').where('userId', '==', userId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    query = query.orderBy('createdAt', 'desc').limit(limit);
    
    if (offset > 0) {
      // For pagination, we'd need to use startAfter with a document
      // This is a simplified version
    }
    
    const snapshot = await query.get();
    
    const campaigns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return createSuccessResponse({
      campaigns,
      total: campaigns.length,
      hasMore: campaigns.length === limit,
    });
  } catch (error) {
    console.error('getCampaigns error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to get campaigns'
    );
  }
});

/**
 * Get campaign details
 */
export const getCampaignDetails = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const { campaignId } = data;
    
    if (!campaignId) {
      throw new functions.https.HttpsError('invalid-argument', 'Campaign ID is required');
    }
    
    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    
    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Campaign not found');
    }
    
    const campaign = campaignDoc.data() as Campaign;
    
    if (campaign.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }
    
    // Get recipients
    const recipientsSnapshot = await campaignDoc.ref.collection('recipients').get();
    const recipients = recipientsSnapshot.docs.map((doc) => doc.data());
    
    // Get validation errors (emails that were invalid)
    const validationErrors = recipients
      .filter((r) => !isValidEmail(r.email))
      .map((r) => ({
        rowNumber: r.rowNumber,
        field: campaign.emailColumn,
        message: 'Invalid email address',
        severity: 'error',
      }));
    
    return createSuccessResponse({
      ...campaign,
      id: campaignId,
      recipients,
      validationErrors,
    });
  } catch (error) {
    console.error('getCampaignDetails error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to get campaign details'
    );
  }
});

/**
 * Send campaign
 */
export const sendCampaign = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const { campaignId } = data;
    
    if (!campaignId) {
      throw new functions.https.HttpsError('invalid-argument', 'Campaign ID is required');
    }
    
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Campaign not found');
    }
    
    const campaign = campaignDoc.data() as Campaign;
    
    if (campaign.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }
    
    if (campaign.status === 'sending') {
      throw new functions.https.HttpsError('failed-precondition', 'Campaign is already sending');
    }
    
    // Update campaign status
    await campaignRef.update({
      status: 'sending',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Get pending recipients
    const recipientsSnapshot = await campaignRef
      .collection('recipients')
      .where('status', 'in', ['pending', 'failed'])
      .get();
    
    const recipients = recipientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Get access token
    const accessToken = await getValidAccessToken(userId);
    
    // Initialize progress document
    const progressRef = campaignRef.collection('progress').doc('current');
    await progressRef.set({
      current: 0,
      total: recipients.length,
      percentage: 0,
      status: 'running',
      rateLimited: false,
      sentCount: 0,
      failedCount: 0,
    });
    
    // Start sending in background
    // Note: In production, you might want to use a queue system like Cloud Tasks
    sendCampaignEmails({
      userId,
      campaignId,
      accessToken,
      subject: campaign.subject,
      body: campaign.body,
      columnMapping: campaign.columnMapping,
      emailColumn: campaign.emailColumn,
      recipients: recipients as Array<{ rowNumber: number; email: string }>,
      onProgress: async (progress) => {
        await progressRef.update({
          current: progress.current,
          total: progress.total,
          percentage: Math.round((progress.current / progress.total) * 100),
          currentEmail: progress.currentEmail,
          sentCount: progress.sentCount,
          failedCount: progress.failedCount,
        });
        
        await campaignRef.update({
          sentCount: progress.sentCount,
          failedCount: progress.failedCount,
          progress: Math.round((progress.current / progress.total) * 100),
        });
      },
      onComplete: async (result) => {
        await progressRef.update({
          status: 'completed',
          percentage: 100,
        });
        
        await campaignRef.update({
          status: 'completed',
          sentCount: result.sent,
          failedCount: result.failed,
          progress: 100,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      },
      shouldStop: () => false,
      shouldPause: () => false,
    }).catch(async (error) => {
      console.error('Campaign sending error:', error);
      
      await campaignRef.update({
        status: 'failed',
        errorMessage: error.message,
      });
      
      await progressRef.update({
        status: 'failed',
      });
    });
    
    return createSuccessResponse({
      success: true,
      message: 'Campaign started successfully',
    });
  } catch (error) {
    console.error('sendCampaign error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to send campaign'
    );
  }
});

/**
 * Pause campaign
 */
export const pauseCampaign = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const { campaignId } = data;
    
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Campaign not found');
    }
    
    const campaign = campaignDoc.data() as Campaign;
    
    if (campaign.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }
    
    await campaignRef.update({ status: 'paused' });
    
    const progressRef = campaignRef.collection('progress').doc('current');
    await progressRef.update({ status: 'paused' });
    
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('pauseCampaign error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to pause campaign'
    );
  }
});

/**
 * Resume campaign
 */
export const resumeCampaign = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const { campaignId } = data;
    
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Campaign not found');
    }
    
    const campaign = campaignDoc.data() as Campaign;
    
    if (campaign.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }
    
    await campaignRef.update({ status: 'sending' });
    
    const progressRef = campaignRef.collection('progress').doc('current');
    await progressRef.update({ status: 'running' });
    
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('resumeCampaign error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to resume campaign'
    );
  }
});

/**
 * Stop campaign
 */
export const stopCampaign = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const { campaignId } = data;
    
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Campaign not found');
    }
    
    const campaign = campaignDoc.data() as Campaign;
    
    if (campaign.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }
    
    await campaignRef.update({
      status: 'stopped',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    const progressRef = campaignRef.collection('progress').doc('current');
    await progressRef.update({ status: 'stopped' });
    
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('stopCampaign error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to stop campaign'
    );
  }
});

/**
 * Delete campaign
 */
export const deleteCampaign = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const { campaignId } = data;
    
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Campaign not found');
    }
    
    const campaign = campaignDoc.data() as Campaign;
    
    if (campaign.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }
    
    // Delete recipients subcollection
    const recipientsSnapshot = await campaignRef.collection('recipients').get();
    const batch = db.batch();
    recipientsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    // Delete progress document
    const progressDoc = await campaignRef.collection('progress').doc('current').get();
    if (progressDoc.exists) {
      await progressDoc.ref.delete();
    }
    
    // Delete campaign
    await campaignRef.delete();
    
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('deleteCampaign error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to delete campaign'
    );
  }
});

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Get dashboard stats
 */
export const getDashboardStats = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    
    // Get all campaigns for user
    const campaignsSnapshot = await db
      .collection('campaigns')
      .where('userId', '==', userId)
      .get();
    
    const campaigns = campaignsSnapshot.docs.map((doc) => doc.data() as Campaign);
    
    // Calculate stats
    const totalCampaigns = campaigns.length;
    const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
    const totalFailed = campaigns.reduce((sum, c) => sum + (c.failedCount || 0), 0);
    
    const completedCampaigns = campaigns.filter((c) => c.status === 'completed');
    const averageSuccessRate =
      completedCampaigns.length > 0
        ? completedCampaigns.reduce((sum, c) => {
            const rate = c.totalRecipients > 0 ? (c.sentCount / c.totalRecipients) * 100 : 0;
            return sum + rate;
          }, 0) / completedCampaigns.length
        : 0;
    
    // Get recent campaigns
    const recentCampaigns = campaigns
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .slice(0, 5)
      .map((c) => ({
        id: campaignsSnapshot.docs.find((d) => d.data() === c)?.id,
        ...c,
      }));
    
    return createSuccessResponse({
      totalCampaigns,
      totalSent,
      totalFailed,
      averageSuccessRate,
      recentCampaigns,
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to get dashboard stats'
    );
  }
});

// ============================================================================
// TEST EMAIL FUNCTION
// ============================================================================

/**
 * Send test email
 */
export const sendTestEmail = functions.https.onCall(async (data, context) => {
  try {
    const userId = await verifyAuth(context);
    const { to, subject, body, isHtml = true } = data;
    
    if (!to || !subject || !body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'To, subject, and body are required'
      );
    }
    
    if (!isValidEmail(to)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email address');
    }
    
    const accessToken = await getValidAccessToken(userId);
    
    const result = await sendEmail(accessToken, {
      to,
      subject,
      body,
      isHtml,
    });
    
    if (!result.success) {
      throw new functions.https.HttpsError('internal', result.error || 'Failed to send email');
    }
    
    return createSuccessResponse({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('sendTestEmail error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Failed to send test email'
    );
  }
});
