/**
 * SheetMail Sender - Template Editor Screen
 * =========================================
 * Screen for creating and editing email templates
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RichEditor, RichToolbar } from 'react-native-pell-rich-editor';

import { COLORS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '@constants';
import { useThemeStore, useSheetsStore, useTemplatesStore, useUIStore } from '@store';
import { extractPlaceholders, replacePlaceholders, getPlaceholderSamples } from '@utils';
import { testEmailApi } from '@services/api';
import type { RootStackParamList } from '@navigation/types';

// ============================================================================
// PLACEHOLDER CHIP COMPONENT
// ============================================================================

interface PlaceholderChipProps {
  name: string;
  sampleValue: string;
  onPress: () => void;
  colors: typeof lightColors;
}

function PlaceholderChip({ name, sampleValue, onPress, colors }: PlaceholderChipProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: `${COLORS.PRIMARY}15` }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, { color: COLORS.PRIMARY }]}>{`{${name}}`}</Text>
      <Text style={[styles.chipSample, { color: colors.textTertiary }]} numberOfLines={1}>
        {sampleValue || 'No sample'}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// PREVIEW MODAL COMPONENT
// ============================================================================

interface PreviewModalProps {
  visible: boolean;
  subject: string;
  body: string;
  onClose: () => void;
  colors: typeof lightColors;
}

function PreviewModal({ visible, subject, body, onClose, colors }: PreviewModalProps): JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Email Preview
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.previewContainer}>
            <View style={[styles.previewField, { backgroundColor: colors.surface }]}>
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                Subject
              </Text>
              <Text style={[styles.previewSubject, { color: colors.textPrimary }]}>
                {subject}
              </Text>
            </View>
            
            <View style={[styles.previewBody, { backgroundColor: colors.surface }]}>
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                Body
              </Text>
              <Text style={[styles.previewBodyText, { color: colors.textPrimary }]}>
                {body}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// TEST EMAIL MODAL COMPONENT
// ============================================================================

interface TestEmailModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (email: string) => void;
  isSending: boolean;
  colors: typeof lightColors;
}

function TestEmailModal({ visible, onClose, onSend, isSending, colors }: TestEmailModalProps): JSX.Element {
  const [email, setEmail] = useState('');
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Send Test Email
          </Text>
          <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
            Enter your email address to receive a test email with sample data.
          </Text>
          
          <TextInput
            style={[
              styles.testEmailInput,
              { color: colors.textPrimary, borderColor: colors.border },
            ]}
            placeholder="your@email.com"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.surface }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: COLORS.PRIMARY },
                (!email || isSending) && styles.modalButtonDisabled,
              ]}
              onPress={() => onSend(email)}
              disabled={!email || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>
                  Send Test
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// TEMPLATE EDITOR SCREEN COMPONENT
// ============================================================================

export default function TemplateEditorScreen(): JSX.Element {
  const systemColorScheme = useColorScheme();
  const { theme } = useThemeStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { sheetData } = useSheetsStore();
  const { subject, body, setSubject, setBody, setPlaceholders } = useTemplatesStore();
  
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  
  const richText = useRef<RichEditor>(null);
  const [placeholders, setLocalPlaceholders] = useState<Array<{ name: string; sampleValue: string }>>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewBody, setPreviewBody] = useState('');
  
  // Get sample row for placeholders
  const sampleRow = sheetData?.rows[0] || {};
  const columnMapping: Record<string, string> = {};
  
  // Build column mapping from sheet data
  useEffect(() => {
    if (sheetData) {
      sheetData.columns.forEach((col) => {
        const lowerName = col.name.toLowerCase();
        if (lowerName.includes('email')) columnMapping.Email = col.name;
        if (lowerName.includes('name')) columnMapping.Name = col.name;
        if (lowerName.includes('company')) columnMapping.Company = col.name;
        if (lowerName.includes('title')) columnMapping.Title = col.name;
      });
    }
  }, [sheetData]);
  
  // Extract placeholders when body or subject changes
  useEffect(() => {
    const subjectPlaceholders = extractPlaceholders(subject);
    const bodyPlaceholders = extractPlaceholders(body);
    const allPlaceholders = [...new Set([...subjectPlaceholders, ...bodyPlaceholders])];
    
    const placeholderData = allPlaceholders.map((name) => ({
      name,
      sampleValue: String(sampleRow[columnMapping[name] || name] || ''),
    }));
    
    setLocalPlaceholders(placeholderData);
    setPlaceholders(allPlaceholders);
  }, [subject, body, sampleRow, columnMapping, setPlaceholders]);
  
  const handleInsertPlaceholder = (placeholder: string) => {
    richText.current?.insertText(`{${placeholder}}`);
  };
  
  const handlePreview = () => {
    // Generate preview with sample data
    const mappedData: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([key, value]) => {
      mappedData[key] = String(sampleRow[value] || '');
    });
    
    setPreviewSubject(replacePlaceholders(subject, mappedData, columnMapping));
    setPreviewBody(replacePlaceholders(body, mappedData, columnMapping));
    setShowPreview(true);
  };
  
  const handleSendTest = async (email: string) => {
    setIsSendingTest(true);
    try {
      // Generate preview with sample data
      const mappedData: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([key, value]) => {
        mappedData[key] = String(sampleRow[value] || '');
      });
      
      const testSubject = replacePlaceholders(subject, mappedData, columnMapping);
      const testBody = replacePlaceholders(body, mappedData, columnMapping);
      
      await testEmailApi.sendTestEmail({
        to: email,
        subject: testSubject,
        body: testBody,
        isHtml: true,
      });
      
      useUIStore.getState().showToast('Test email sent!', 'success');
      setShowTestModal(false);
    } catch (error) {
      console.error('Failed to send test email:', error);
      useUIStore.getState().showToast('Failed to send test email', 'error');
    } finally {
      setIsSendingTest(false);
    }
  };
  
  const handleContinue = () => {
    if (!subject.trim()) {
      useUIStore.getState().showToast('Please enter a subject line', 'error');
      return;
    }
    if (!body.trim()) {
      useUIStore.getState().showToast('Please enter an email body', 'error');
      return;
    }
    
    navigation.navigate('CampaignPreview');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Email Template
        </Text>
        <TouchableOpacity onPress={handleContinue}>
          <Text style={[styles.headerAction, { color: COLORS.PRIMARY }]}>Next</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Subject Input */}
          <View style={styles.subjectSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Subject Line
            </Text>
            <TextInput
              style={[
                styles.subjectInput,
                { color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="Enter email subject..."
              placeholderTextColor={colors.textTertiary}
              value={subject}
              onChangeText={setSubject}
              maxLength={998}
            />
            <Text style={[styles.characterCount, { color: colors.textTertiary }]}>
              {subject.length}/998
            </Text>
          </View>
          
          {/* Placeholders Section */}
          {placeholders.length > 0 && (
            <View style={styles.placeholdersSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Available Placeholders
              </Text>
              <Text style={[styles.placeholdersHint, { color: colors.textTertiary }]}>
                Tap to insert into your email
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
              >
                {placeholders.map((placeholder) => (
                  <PlaceholderChip
                    key={placeholder.name}
                    name={placeholder.name}
                    sampleValue={placeholder.sampleValue}
                    onPress={() => handleInsertPlaceholder(placeholder.name)}
                    colors={colors}
                  />
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Email Body Editor */}
          <View style={styles.editorSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Email Body
            </Text>
            <View
              style={[
                styles.editorContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <RichToolbar
                editor={richText}
                selectedIconTint={COLORS.PRIMARY}
                iconTint={colors.textSecondary}
                actions={[
                  'bold',
                  'italic',
                  'underline',
                  'unorderedList',
                  'orderedList',
                  'link',
                ]}
                style={{ backgroundColor: colors.surface }}
              />
              <RichEditor
                ref={richText}
                style={styles.richEditor}
                placeholder="Write your email here..."
                initialContentHTML={body}
                onChange={setBody}
                editorStyle={{
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  placeholderColor: colors.textTertiary,
                  contentCSSText: `
                    font-family: system-ui;
                    font-size: 16px;
                    line-height: 1.5;
                    padding: 16px;
                  `,
                }}
              />
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }, SHADOWS.SM]}
              onPress={handlePreview}
            >
              <Icon name="eye" size={20} color={COLORS.PRIMARY} />
              <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>
                Preview
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }, SHADOWS.SM]}
              onPress={() => setShowTestModal(true)}
            >
              <Icon name="send" size={20} color={COLORS.PRIMARY} />
              <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>
                Send Test
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Preview Modal */}
      <PreviewModal
        visible={showPreview}
        subject={previewSubject}
        body={previewBody}
        onClose={() => setShowPreview(false)}
        colors={colors}
      />
      
      {/* Test Email Modal */}
      <TestEmailModal
        visible={showTestModal}
        onClose={() => setShowTestModal(false)}
        onSend={handleSendTest}
        isSending={isSendingTest}
        colors={colors}
      />
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
  headerAction: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.LG,
  },
  subjectSection: {
    marginBottom: SPACING.LG,
  },
  sectionLabel: {
    fontSize: FONTS.SIZES.SM,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
    marginBottom: SPACING.SM,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subjectInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    fontSize: FONTS.SIZES.MD,
  },
  characterCount: {
    fontSize: FONTS.SIZES.XS,
    textAlign: 'right',
    marginTop: SPACING.XS,
  },
  placeholdersSection: {
    marginBottom: SPACING.LG,
  },
  placeholdersHint: {
    fontSize: FONTS.SIZES.XS,
    marginBottom: SPACING.SM,
  },
  chipsContainer: {
    paddingVertical: SPACING.XS,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.FULL,
    marginRight: SPACING.SM,
  },
  chipText: {
    fontSize: FONTS.SIZES.SM,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
    marginRight: SPACING.XS,
  },
  chipSample: {
    fontSize: FONTS.SIZES.XS,
    maxWidth: 80,
  },
  editorSection: {
    marginBottom: SPACING.LG,
  },
  editorContainer: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
  },
  richEditor: {
    minHeight: 250,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    gap: SPACING.SM,
  },
  actionButtonText: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.XL,
    borderTopRightRadius: BORDER_RADIUS.XL,
    padding: SPACING.LG,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  modalTitle: {
    fontSize: FONTS.SIZES.XL,
    fontWeight: FONTS.WEIGHTS.BOLD,
  },
  modalDescription: {
    fontSize: FONTS.SIZES.MD,
    marginBottom: SPACING.LG,
  },
  previewContainer: {
    maxHeight: 400,
  },
  previewField: {
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
  },
  previewLabel: {
    fontSize: FONTS.SIZES.XS,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.XS,
  },
  previewSubject: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
  previewBody: {
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
  },
  previewBodyText: {
    fontSize: FONTS.SIZES.MD,
    lineHeight: 24,
  },
  testEmailInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    fontSize: FONTS.SIZES.MD,
    marginBottom: SPACING.LG,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
});
