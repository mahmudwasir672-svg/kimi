/**
 * SheetMail Sender - Campaign Preview Screen
 * ==========================================
 * Screen for previewing campaign before sending
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '@constants';
import { useThemeStore, useSheetsStore, useTemplatesStore, useCampaignsStore, useUIStore } from '@store';
import { campaignsApi } from '@services/api';
import { replacePlaceholders, isValidEmail, validateSheetData } from '@utils';
import type { RootStackParamList } from '@navigation/types';

// ============================================================================
// PREVIEW ROW COMPONENT
// ============================================================================

interface PreviewRowProps {
  index: number;
  email: string;
  subject: string;
  body: string;
  isValid: boolean;
  colors: typeof lightColors;
}

function PreviewRow({ index, email, subject, body, isValid, colors }: PreviewRowProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <View
      style={[
        styles.previewRow,
        { backgroundColor: colors.surface },
        !isValid && styles.previewRowInvalid,
        SHADOWS.SM,
      ]}
    >
      <TouchableOpacity
        style={styles.previewRowHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.previewRowIndex}>
          <Text style={[styles.previewRowIndexText, { color: colors.textTertiary }]}>
            {index + 1}
          </Text>
        </View>
        <View style={styles.previewRowInfo}>
          <Text
            style={[
              styles.previewRowEmail,
              { color: isValid ? colors.textPrimary : COLORS.ERROR },
            ]}
            numberOfLines={1}
          >
            {email || 'No email'}
          </Text>
          <Text style={[styles.previewRowSubject, { color: colors.textSecondary }]} numberOfLines={1}>
            {subject}
          </Text>
        </View>
        <View style={styles.previewRowStatus}>
          {isValid ? (
            <Icon name="check-circle" size={20} color={COLORS.SUCCESS} />
          ) : (
            <Icon name="alert-circle" size={20} color={COLORS.ERROR} />
          )}
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textTertiary}
            style={{ marginLeft: SPACING.SM }}
          />
        </View>
      </TouchableOpacity>
      
      {expanded && (
        <View style={[styles.previewRowBody, { borderTopColor: colors.border }]}>
          <Text style={[styles.previewBodyLabel, { color: colors.textSecondary }]}>
            Subject:
          </Text>
          <Text style={[styles.previewBodyText, { color: colors.textPrimary }]}>
            {subject}
          </Text>
          <Text style={[styles.previewBodyLabel, { color: colors.textSecondary, marginTop: SPACING.SM }]}>
            Body:
          </Text>
          <Text style={[styles.previewBodyText, { color: colors.textPrimary }]}>
            {body}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  colors: typeof lightColors;
}

function StatCard({ label, value, color, colors }: StatCardProps): JSX.Element {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }, SHADOWS.SM]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ============================================================================
// CAMPAIGN PREVIEW SCREEN COMPONENT
// ============================================================================

export default function CampaignPreviewScreen(): JSX.Element {
  const systemColorScheme = useColorScheme();
  const { theme } = useThemeStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { sheetData, selectedSheet } = useSheetsStore();
  const { subject, body } = useTemplatesStore();
  const { setCurrentCampaign, setCreating } = useCampaignsStore();
  
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  
  const [isCreating, setIsCreatingLocal] = useState(false);
  const [previewData, setPreviewData] = useState<Array<{
    email: string;
    subject: string;
    body: string;
    isValid: boolean;
  }>>([]);
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
  });
  
  // Build column mapping
  const columnMapping: Record<string, string> = {};
  if (sheetData) {
    sheetData.columns.forEach((col) => {
      const lowerName = col.name.toLowerCase();
      if (lowerName.includes('email')) columnMapping.Email = col.name;
      if (lowerName.includes('name')) columnMapping.Name = col.name;
      if (lowerName.includes('company')) columnMapping.Company = col.name;
      if (lowerName.includes('title')) columnMapping.Title = col.name;
    });
  }
  
  // Generate preview data
  useEffect(() => {
    if (!sheetData) return;
    
    const emailColumn = sheetData.columns.find(
      (col) => col.type === 'email' || col.name.toLowerCase().includes('email')
    )?.name || '';
    
    const previews = sheetData.rows.slice(0, 10).map((row) => {
      const mappedData: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([key, value]) => {
        mappedData[key] = String(row[value] || '');
      });
      
      const email = String(row[emailColumn] || '');
      const replacedSubject = replacePlaceholders(subject, mappedData, columnMapping);
      const replacedBody = replacePlaceholders(body, mappedData, columnMapping);
      
      return {
        email,
        subject: replacedSubject,
        body: replacedBody,
        isValid: isValidEmail(email),
      };
    });
    
    setPreviewData(previews);
    
    // Calculate stats for all rows
    const allEmails = sheetData.rows.map((row) => String(row[emailColumn] || ''));
    const validEmails = allEmails.filter(isValidEmail);
    
    setStats({
      total: sheetData.totalRows,
      valid: validEmails.length,
      invalid: sheetData.totalRows - validEmails.length,
    });
  }, [sheetData, subject, body, columnMapping]);
  
  const handleCreateCampaign = async () => {
    if (!selectedSheet || !sheetData) return;
    
    if (stats.invalid > 0) {
      Alert.alert(
        'Invalid Emails Found',
        `${stats.invalid} email addresses are invalid. Do you want to continue and skip these rows?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => createCampaign() },
        ]
      );
    } else {
      createCampaign();
    }
  };
  
  const createCampaign = async () => {
    if (!selectedSheet || !sheetData) return;
    
    setIsCreatingLocal(true);
    setCreating(true);
    
    try {
      const emailColumn = sheetData.columns.find(
        (col) => col.type === 'email' || col.name.toLowerCase().includes('email')
      )?.name || '';
      
      const campaign = await campaignsApi.createCampaign({
        name: `${selectedSheet.name} - ${new Date().toLocaleDateString()}`,
        sheetId: selectedSheet.id,
        sheetName: selectedSheet.name,
        subject,
        body,
        columnMapping,
        emailColumn,
      });
      
      setCurrentCampaign(campaign);
      useUIStore.getState().showToast('Campaign created successfully!', 'success');
      
      navigation.navigate('Sending');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      useUIStore.getState().showToast('Failed to create campaign', 'error');
    } finally {
      setIsCreatingLocal(false);
      setCreating(false);
    }
  };
  
  if (!sheetData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={COLORS.ERROR} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
            No sheet data found
          </Text>
          <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>
            Please go back and select a sheet first.
          </Text>
          <TouchableOpacity
            style={[styles.errorButton, { backgroundColor: COLORS.PRIMARY }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Preview Campaign
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <StatCard
            label="Total Recipients"
            value={stats.total}
            color={COLORS.PRIMARY}
            colors={colors}
          />
          <StatCard
            label="Valid Emails"
            value={stats.valid}
            color={COLORS.SUCCESS}
            colors={colors}
          />
          <StatCard
            label="Invalid"
            value={stats.invalid}
            color={stats.invalid > 0 ? COLORS.ERROR : COLORS.SUCCESS}
            colors={colors}
          />
        </View>
        
        {/* Sheet Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }, SHADOWS.SM]}>
          <Icon name="google-spreadsheet" size={24} color={COLORS.SUCCESS} />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
              {selectedSheet?.name}
            </Text>
            <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
              {sheetData.totalRows} rows • {sheetData.columns.length} columns
            </Text>
          </View>
        </View>
        
        {/* Subject Preview */}
        <View style={[styles.subjectCard, { backgroundColor: colors.surface }, SHADOWS.SM]}>
          <Text style={[styles.subjectLabel, { color: colors.textSecondary }]}>
            Subject Line
          </Text>
          <Text style={[styles.subjectText, { color: colors.textPrimary }]}>
            {subject}
          </Text>
        </View>
        
        {/* Preview Section */}
        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>
              Email Preview (First 10)
            </Text>
            <Text style={[styles.previewSubtitle, { color: colors.textSecondary }]}>
              Tap to expand
            </Text>
          </View>
          
          {previewData.map((preview, index) => (
            <PreviewRow
              key={index}
              index={index}
              email={preview.email}
              subject={preview.subject}
              body={preview.body}
              isValid={preview.isValid}
              colors={colors}
            />
          ))}
        </View>
        
        {/* Warning for invalid emails */}
        {stats.invalid > 0 && (
          <View style={[styles.warningCard, { backgroundColor: COLORS.WARNING_50 }]}>
            <Icon name="alert" size={20} color={COLORS.WARNING} />
            <Text style={[styles.warningText, { color: COLORS.WARNING_DARK }]}>
              {stats.invalid} rows have invalid email addresses and will be skipped.
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Bottom Action */}
      <View style={[styles.bottomAction, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: COLORS.PRIMARY },
            isCreating && styles.sendButtonDisabled,
          ]}
          onPress={handleCreateCampaign}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Icon name="send" size={20} color="#FFF" />
              <Text style={styles.sendButtonText}>
                Start Campaign
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// THEME COLORS
// ============================================================================

const lightColors = {
  background: COLORS.LIGHT_BACKGROUND,
  surface: COLORS.LIGHT_SURFACE,
  border: COLORS.LIGHT_BORDER,
  textPrimary: COLORS.LIGHT_TEXT_PRIMARY,
  textSecondary: COLORS.LIGHT_TEXT_SECONDARY,
  textTertiary: COLORS.LIGHT_TEXT_TERTIARY,
};

const darkColors = {
  background: COLORS.DARK_BACKGROUND,
  surface: COLORS.DARK_SURFACE,
  border: COLORS.DARK_BORDER,
  textPrimary: COLORS.DARK_TEXT_PRIMARY,
  textSecondary: COLORS.DARK_TEXT_SECONDARY,
  textTertiary: COLORS.DARK_TEXT_TERTIARY,
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
  },
  headerTitle: {
    fontSize: FONTS.SIZES.LG,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
  scrollContent: {
    padding: SPACING.LG,
    paddingBottom: 100,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    marginHorizontal: SPACING.XS,
  },
  statValue: {
    fontSize: FONTS.SIZES.XXL,
    fontWeight: FONTS.WEIGHTS.BOLD,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONTS.SIZES.XS,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    marginBottom: SPACING.MD,
  },
  infoText: {
    marginLeft: SPACING.MD,
    flex: 1,
  },
  infoTitle: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
  infoSubtitle: {
    fontSize: FONTS.SIZES.SM,
    marginTop: 2,
  },
  subjectCard: {
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    marginBottom: SPACING.LG,
  },
  subjectLabel: {
    fontSize: FONTS.SIZES.XS,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.XS,
  },
  subjectText: {
    fontSize: FONTS.SIZES.MD,
  },
  previewSection: {
    marginBottom: SPACING.LG,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  previewTitle: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
  previewSubtitle: {
    fontSize: FONTS.SIZES.SM,
  },
  previewRow: {
    borderRadius: BORDER_RADIUS.LG,
    marginBottom: SPACING.MD,
    overflow: 'hidden',
  },
  previewRowInvalid: {
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  previewRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
  },
  previewRowIndex: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  previewRowIndexText: {
    fontSize: FONTS.SIZES.SM,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
  },
  previewRowInfo: {
    flex: 1,
  },
  previewRowEmail: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
    marginBottom: 2,
  },
  previewRowSubject: {
    fontSize: FONTS.SIZES.SM,
  },
  previewRowStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewRowBody: {
    padding: SPACING.MD,
    borderTopWidth: 1,
  },
  previewBodyLabel: {
    fontSize: FONTS.SIZES.XS,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.XS,
  },
  previewBodyText: {
    fontSize: FONTS.SIZES.SM,
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.LG,
  },
  warningText: {
    fontSize: FONTS.SIZES.SM,
    marginLeft: SPACING.SM,
    flex: 1,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.LG,
    borderTopWidth: 1,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    gap: SPACING.SM,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: FONTS.SIZES.LG,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  errorTitle: {
    fontSize: FONTS.SIZES.XL,
    fontWeight: FONTS.WEIGHTS.BOLD,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  errorDescription: {
    fontSize: FONTS.SIZES.MD,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  errorButton: {
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
});
