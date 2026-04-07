/**
 * SheetMail Sender - Navigation Types
 * ===================================
 * Type definitions for navigation
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ============================================================================
// ROOT STACK PARAM LIST
// ============================================================================

export type RootStackParamList = {
  // Auth
  Login: undefined;
  
  // Main
  Dashboard: undefined;
  
  // Campaign Creation Flow
  SheetSelect: undefined;
  TemplateEditor: undefined;
  CampaignPreview: undefined;
  Sending: undefined;
  
  // History & Details
  History: undefined;
  CampaignDetails: { campaignId: string };
  
  // Templates
  Templates: undefined;
  TemplateDetails: { templateId: string };
  
  // Settings
  Settings: undefined;
  Profile: undefined;
  About: undefined;
};

// ============================================================================
// SCREEN PROPS
// ============================================================================

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
export type SheetSelectScreenProps = NativeStackScreenProps<RootStackParamList, 'SheetSelect'>;
export type TemplateEditorScreenProps = NativeStackScreenProps<RootStackParamList, 'TemplateEditor'>;
export type CampaignPreviewScreenProps = NativeStackScreenProps<RootStackParamList, 'CampaignPreview'>;
export type SendingScreenProps = NativeStackScreenProps<RootStackParamList, 'Sending'>;
export type HistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'History'>;
export type CampaignDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'CampaignDetails'>;
export type TemplatesScreenProps = NativeStackScreenProps<RootStackParamList, 'Templates'>;
export type TemplateDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'TemplateDetails'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
export type AboutScreenProps = NativeStackScreenProps<RootStackParamList, 'About'>;

// ============================================================================
// NAVIGATION PROP TYPES
// ============================================================================

export type RootNavigationProp = NativeStackScreenProps<RootStackParamList>['navigation'];

// ============================================================================
// ROUTE PARAM TYPES
// ============================================================================

export type CampaignDetailsRouteParams = {
  campaignId: string;
};

export type TemplateDetailsRouteParams = {
  templateId: string;
};
