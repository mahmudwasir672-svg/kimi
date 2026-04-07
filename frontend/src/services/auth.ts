/**
 * SheetMail Sender - Authentication Service
 * =========================================
 * Google Sign-In and authentication logic
 */

import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { signInWithCredential, GoogleAuthProvider, signOut } from 'firebase/auth';

import { GOOGLE_CONFIG } from '@constants';
import { ERROR_MESSAGES } from '@constants';
import { getFirebaseAuth } from './firebase';
import { authApi } from './api';
import { useAuthStore, useUIStore } from '@store';

// ============================================================================
// GOOGLE SIGN-IN CONFIGURATION
// ============================================================================

/**
 * Configure Google Sign-In
 */
export function configureGoogleSignIn(): void {
  GoogleSignin.configure({
    webClientId: GOOGLE_CONFIG.WEB_CLIENT_ID,
    iosClientId: GOOGLE_CONFIG.IOS_CLIENT_ID,
    androidClientId: GOOGLE_CONFIG.ANDROID_CLIENT_ID,
    scopes: GOOGLE_CONFIG.SCOPES,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
}

// ============================================================================
// SIGN IN WITH GOOGLE
// ============================================================================

export interface SignInResult {
  success: boolean;
  error?: string;
  needsAdditionalScopes?: boolean;
}

/**
 * Sign in with Google using native SDK
 */
export async function signInWithGoogle(): Promise<SignInResult> {
  const { setLoading, setError } = useAuthStore.getState();
  
  try {
    setLoading(true);
    
    // Check if Google Play Services are available (Android)
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    
    // Sign in with Google
    const userInfo = await GoogleSignin.signIn();
    
    if (!userInfo.data) {
      throw new Error('No user data returned from Google Sign-In');
    }
    
    const { idToken, authorizationCode } = userInfo.data;
    
    if (!idToken) {
      throw new Error('No ID token received from Google');
    }
    
    // Sign in to Firebase with Google credential
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const auth = getFirebaseAuth();
    await signInWithCredential(auth, googleCredential);
    
    // Exchange authorization code for refresh token (server-side)
    if (authorizationCode) {
      try {
        const redirectUri = AuthSession.makeRedirectUri({
          native: 'com.yourcompany.sheetmailsender:/oauth2redirect',
        });
        
        await authApi.exchangeToken(authorizationCode, redirectUri);
        
        useAuthStore.getState().updateUser({
          hasGmailAccess: true,
          hasSheetsAccess: true,
        });
      } catch (error) {
        console.error('Failed to exchange token:', error);
        // User is signed in but Google API access might be limited
        return {
          success: true,
          needsAdditionalScopes: true,
        };
      }
    }
    
    useUIStore.getState().showToast('Successfully signed in!', 'success');
    
    return { success: true };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    
    let errorMessage = ERROR_MESSAGES.AUTH_FAILED;
    
    if (error instanceof Error) {
      // Handle specific Google Sign-In errors
      if (error.message.includes(statusCodes.SIGN_IN_CANCELLED)) {
        errorMessage = ERROR_MESSAGES.AUTH_CANCELLED;
      } else if (error.message.includes(statusCodes.IN_PROGRESS)) {
        errorMessage = 'Sign in is already in progress';
      } else if (error.message.includes(statusCodes.PLAY_SERVICES_NOT_AVAILABLE)) {
        errorMessage = 'Google Play Services are not available';
      } else {
        errorMessage = error.message;
      }
    }
    
    setError(errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    setLoading(false);
  }
}

// ============================================================================
// WEB-BASED OAUTH (Fallback)
// ============================================================================

/**
 * Sign in with Google using web-based OAuth
 * Use this as a fallback if native sign-in fails
 */
export async function signInWithGoogleWeb(): Promise<SignInResult> {
  const { setLoading, setError } = useAuthStore.getState();
  
  try {
    setLoading(true);
    
    const redirectUri = AuthSession.makeRedirectUri({
      native: 'com.yourcompany.sheetmailsender:/oauth2redirect',
    });
    
    const authUrl = 
      `${GOOGLE_CONFIG.AUTH_ENDPOINT}?` +
      `client_id=${GOOGLE_CONFIG.WEB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(GOOGLE_CONFIG.SCOPES.join(' '))}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    
    if (result.type === 'success' && result.url) {
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }
      
      if (code) {
        // Exchange code for tokens
        await authApi.exchangeToken(code, redirectUri);
        
        // Note: With web-based OAuth, we need to handle Firebase auth separately
        // or use a custom token flow
        
        return { success: true };
      }
    }
    
    if (result.type === 'cancel') {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH_CANCELLED,
      };
    }
    
    throw new Error('Authentication failed');
  } catch (error) {
    console.error('Web OAuth error:', error);
    
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.AUTH_FAILED;
    setError(errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    setLoading(false);
  }
}

// ============================================================================
// SIGN OUT
// ============================================================================

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  const { logout } = useAuthStore.getState();
  
  try {
    // Sign out from Google
    await GoogleSignin.signOut();
    
    // Sign out from Firebase
    const auth = getFirebaseAuth();
    await signOut(auth);
    
    // Clear local state
    logout();
    
    useUIStore.getState().showToast('Signed out successfully', 'success');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Check if user has valid Google tokens
 */
export async function hasValidTokens(): Promise<boolean> {
  try {
    const result = await authApi.validateToken();
    return result.valid;
  } catch {
    return false;
  }
}

/**
 * Refresh Google access token
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    await authApi.refreshToken();
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Get current access token
 */
export async function getCurrentAccessToken(): Promise<string | null> {
  try {
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  } catch {
    return null;
  }
}

// ============================================================================
// PERMISSIONS CHECK
// ============================================================================

/**
 * Check if user has granted required permissions
 */
export async function checkPermissions(): Promise<{
  hasGmail: boolean;
  hasSheets: boolean;
  missingScopes: string[];
}> {
  try {
    const userInfo = await GoogleSignin.getCurrentUser();
    const scopes = userInfo?.data?.scopes || [];
    
    const requiredScopes = {
      gmail: 'https://www.googleapis.com/auth/gmail.send',
      sheets: 'https://www.googleapis.com/auth/spreadsheets',
    };
    
    const hasGmail = scopes.includes(requiredScopes.gmail);
    const hasSheets = scopes.includes(requiredScopes.sheets);
    
    const missingScopes: string[] = [];
    if (!hasGmail) missingScopes.push('gmail.send');
    if (!hasSheets) missingScopes.push('spreadsheets');
    
    return { hasGmail, hasSheets, missingScopes };
  } catch (error) {
    console.error('Permission check failed:', error);
    return { hasGmail: false, hasSheets: false, missingScopes: ['gmail.send', 'spreadsheets'] };
  }
}

/**
 * Request additional permissions
 */
export async function requestAdditionalPermissions(): Promise<SignInResult> {
  try {
    // Re-sign in to request additional scopes
    await GoogleSignin.signOut();
    return signInWithGoogle();
  } catch (error) {
    console.error('Failed to request additional permissions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request permissions',
    };
  }
}

// ============================================================================
// GET CURRENT USER
// ============================================================================

/**
 * Get current signed-in user info
 */
export async function getCurrentUser() {
  try {
    const userInfo = await GoogleSignin.getCurrentUser();
    return userInfo.data;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

// ============================================================================
 * REVOKE ACCESS
// ============================================================================

/**
 * Revoke Google access (for logout or account deletion)
 */
export async function revokeAccess(): Promise<void> {
  try {
    await GoogleSignin.revokeAccess();
    await signOutUser();
  } catch (error) {
    console.error('Revoke access error:', error);
    throw error;
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  configure: configureGoogleSignIn,
  signIn: signInWithGoogle,
  signInWeb: signInWithGoogleWeb,
  signOut: signOutUser,
  hasValidTokens,
  refreshAccessToken,
  getCurrentAccessToken,
  checkPermissions,
  requestAdditionalPermissions,
  getCurrentUser,
  revokeAccess,
};
