/**
 * SheetMail Sender - Sheet Select Screen
 * ======================================
 * Screen for selecting Google Sheets and previewing data
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  useColorScheme,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '@constants';
import { useThemeStore, useSheetsStore, useUIStore } from '@store';
import { sheetsApi } from '@services/api';
import { extractSheetId } from '@utils';
import type { RootStackParamList } from '@navigation/types';
import type { GoogleSheet, SheetData } from '@types';

// ============================================================================
// SHEET LIST ITEM COMPONENT
// ============================================================================

interface SheetListItemProps {
  sheet: GoogleSheet;
  isSelected: boolean;
  onPress: () => void;
  colors: typeof lightColors;
}

function SheetListItem({ sheet, isSelected, onPress, colors }: SheetListItemProps): JSX.Element {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.sheetItem,
        { backgroundColor: colors.surface },
        isSelected && styles.sheetItemSelected,
        SHADOWS.SM,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.sheetIconContainer}>
        <Icon name="google-spreadsheet" size={32} color={COLORS.SUCCESS} />
      </View>
      <View style={styles.sheetInfo}>
        <Text style={[styles.sheetName, { color: colors.textPrimary }]} numberOfLines={1}>
          {sheet.name}
        </Text>
        <Text style={[styles.sheetMeta, { color: colors.textSecondary }]}>
          Modified {formatDate(sheet.modifiedTime)}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Icon name="check-circle" size={24} color={COLORS.PRIMARY} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============================================================================
// COLUMN MAPPING MODAL COMPONENT
// ============================================================================

interface ColumnMappingModalProps {
  visible: boolean;
  sheetData: SheetData | null;
  onClose: () => void;
  onConfirm: (emailColumn: string, nameColumn?: string) => void;
  colors: typeof lightColors;
}

function ColumnMappingModal({
  visible,
  sheetData,
  onClose,
  onConfirm,
  colors,
}: ColumnMappingModalProps): JSX.Element {
  const [emailColumn, setEmailColumn] = useState<string>('');
  const [nameColumn, setNameColumn] = useState<string>('');
  
  useEffect(() => {
    if (sheetData && visible) {
      // Auto-detect email column
      const emailCol = sheetData.columns.find(
        (col) =>
          col.type === 'email' ||
          col.name.toLowerCase().includes('email') ||
          col.name.toLowerCase().includes('e-mail')
      );
      if (emailCol) setEmailColumn(emailCol.name);
      
      // Auto-detect name column
      const nameCol = sheetData.columns.find(
        (col) =>
          col.name.toLowerCase().includes('name') ||
          col.name.toLowerCase().includes('first') ||
          col.name.toLowerCase().includes('full')
      );
      if (nameCol) setNameColumn(nameCol.name);
    }
  }, [sheetData, visible]);
  
  if (!sheetData) return null;
  
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
              Map Columns
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
            Select which columns contain the email addresses and recipient names.
          </Text>
          
          <View style={styles.columnSelectSection}>
            <Text style={[styles.columnSelectLabel, { color: colors.textPrimary }]}>
              Email Column *
            </Text>
            <View style={styles.columnOptions}>
              {sheetData.columns.map((column) => (
                <TouchableOpacity
                  key={column.name}
                  style={[
                    styles.columnOption,
                    { backgroundColor: colors.surface },
                    emailColumn === column.name && styles.columnOptionSelected,
                  ]}
                  onPress={() => setEmailColumn(column.name)}
                >
                  <Text
                    style={[
                      styles.columnOptionText,
                      { color: emailColumn === column.name ? COLORS.PRIMARY : colors.textPrimary },
                    ]}
                  >
                    {column.name}
                  </Text>
                  {emailColumn === column.name && (
                    <Icon name="check" size={16} color={COLORS.PRIMARY} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.columnSelectSection}>
            <Text style={[styles.columnSelectLabel, { color: colors.textPrimary }]}>
              Name Column (Optional)
            </Text>
            <View style={styles.columnOptions}>
              <TouchableOpacity
                style={[
                  styles.columnOption,
                  { backgroundColor: colors.surface },
                  nameColumn === '' && styles.columnOptionSelected,
                ]}
                onPress={() => setNameColumn('')}
              >
                <Text
                  style={[
                    styles.columnOptionText,
                    { color: nameColumn === '' ? COLORS.PRIMARY : colors.textSecondary },
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>
              {sheetData.columns.map((column) => (
                <TouchableOpacity
                  key={column.name}
                  style={[
                    styles.columnOption,
                    { backgroundColor: colors.surface },
                    nameColumn === column.name && styles.columnOptionSelected,
                  ]}
                  onPress={() => setNameColumn(column.name)}
                >
                  <Text
                    style={[
                      styles.columnOptionText,
                      { color: nameColumn === column.name ? COLORS.PRIMARY : colors.textPrimary },
                    ]}
                  >
                    {column.name}
                  </Text>
                  {nameColumn === column.name && (
                    <Icon name="check" size={16} color={COLORS.PRIMARY} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !emailColumn && styles.confirmButtonDisabled,
              { backgroundColor: COLORS.PRIMARY },
            ]}
            onPress={() => onConfirm(emailColumn, nameColumn || undefined)}
            disabled={!emailColumn}
          >
            <Text style={styles.confirmButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// SHEET SELECT SCREEN COMPONENT
// ============================================================================

export default function SheetSelectScreen(): JSX.Element {
  const systemColorScheme = useColorScheme();
  const { theme } = useThemeStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    sheets,
    selectedSheet,
    sheetData,
    setSheets,
    setSelectedSheet,
    setSheetData,
    setLoadingSheets,
    setSheetsError,
  } = useSheetsStore();
  
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [isLoadingSheetData, setIsLoadingSheetData] = useState(false);
  
  const fetchSheets = useCallback(async () => {
    setLoadingSheets(true);
    try {
      const response = await sheetsApi.getSheets();
      setSheets(response.sheets);
    } catch (error) {
      console.error('Failed to fetch sheets:', error);
      setSheetsError('Failed to load your Google Sheets. Please try again.');
      useUIStore.getState().showToast('Failed to load sheets', 'error');
    } finally {
      setLoadingSheets(false);
      setIsRefreshing(false);
    }
  }, [setSheets, setSheetsError, setLoadingSheets]);
  
  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSheets();
  };
  
  const handleSheetSelect = async (sheet: GoogleSheet) => {
    setSelectedSheet(sheet);
    setIsLoadingSheetData(true);
    
    try {
      const data = await sheetsApi.getSheetData(sheet.id);
      setSheetData(data);
      
      // Check if we need column mapping
      const hasEmailColumn = data.columns.some(
        (col) => col.type === 'email' || col.name.toLowerCase().includes('email')
      );
      
      if (!hasEmailColumn) {
        setShowMappingModal(true);
      } else {
        // Auto-detected email column, proceed to template
        navigation.navigate('TemplateEditor');
      }
    } catch (error) {
      console.error('Failed to load sheet data:', error);
      useUIStore.getState().showToast('Failed to load sheet data', 'error');
      setSelectedSheet(null);
    } finally {
      setIsLoadingSheetData(false);
    }
  };
  
  const handleUrlSubmit = async () => {
    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      useUIStore.getState().showToast('Invalid Google Sheets URL', 'error');
      return;
    }
    
    setIsLoadingSheetData(true);
    try {
      const data = await sheetsApi.getSheetData(sheetId);
      setSheetData(data);
      
      // Create a temporary sheet object
      const tempSheet: GoogleSheet = {
        id: sheetId,
        name: data.sheetName || 'Untitled Sheet',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        webViewLink: sheetUrl,
        owner: 'You',
      };
      setSelectedSheet(tempSheet);
      
      // Check if we need column mapping
      const hasEmailColumn = data.columns.some(
        (col) => col.type === 'email' || col.name.toLowerCase().includes('email')
      );
      
      if (!hasEmailColumn) {
        setShowMappingModal(true);
      } else {
        navigation.navigate('TemplateEditor');
      }
    } catch (error) {
      console.error('Failed to load sheet from URL:', error);
      useUIStore.getState().showToast('Failed to load sheet. Check the URL and permissions.', 'error');
    } finally {
      setIsLoadingSheetData(false);
    }
  };
  
  const handleMappingConfirm = (emailColumn: string, nameColumn?: string) => {
    setShowMappingModal(false);
    
    // Store column mapping in state
    if (sheetData) {
      const mapping: Record<string, string> = {
        Email: emailColumn,
      };
      if (nameColumn) {
        mapping.Name = nameColumn;
      }
      
      // Update sheet data with column mapping
      setSheetData({
        ...sheetData,
        columns: sheetData.columns.map((col) => ({
          ...col,
          name: col.name,
        })),
      });
    }
    
    navigation.navigate('TemplateEditor');
  };
  
  const renderSheetItem = ({ item }: { item: GoogleSheet }) => (
    <SheetListItem
      sheet={item}
      isSelected={selectedSheet?.id === item.id}
      onPress={() => handleSheetSelect(item)}
      colors={colors}
    />
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Select Sheet
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* URL Input Section */}
      <View style={[styles.urlSection, { backgroundColor: colors.surface }, SHADOWS.SM]}>
        <Text style={[styles.urlLabel, { color: colors.textSecondary }]}>
          Or paste a Google Sheets URL
        </Text>
        <View style={styles.urlInputContainer}>
          <TextInput
            style={[
              styles.urlInput,
              { color: colors.textPrimary, borderColor: colors.border },
            ]}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            placeholderTextColor={colors.textTertiary}
            value={sheetUrl}
            onChangeText={setSheetUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.urlButton, { backgroundColor: COLORS.PRIMARY }]}
            onPress={handleUrlSubmit}
            disabled={!sheetUrl.trim() || isLoadingSheetData}
          >
            {isLoadingSheetData ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Icon name="arrow-right" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Sheet List */}
      <View style={styles.listContainer}>
        <Text style={[styles.listTitle, { color: colors.textSecondary }]}>
          Your Google Sheets
        </Text>
        
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading your sheets...
            </Text>
          </View>
        ) : (
          <FlatList
            data={sheets}
            renderItem={renderSheetItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.PRIMARY}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="folder-open" size={64} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  No sheets found
                </Text>
                <Text style={[styles.emptyDescription, { color: colors.textTertiary }]}>
                  Create a Google Sheet with contact data to get started
                </Text>
              </View>
            }
          />
        )}
      </View>
      
      {/* Column Mapping Modal */}
      <ColumnMappingModal
        visible={showMappingModal}
        sheetData={sheetData}
        onClose={() => {
          setShowMappingModal(false);
          setSelectedSheet(null);
          setSheetData(null);
        }}
        onConfirm={handleMappingConfirm}
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
  urlSection: {
    margin: SPACING.LG,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
  },
  urlLabel: {
    fontSize: FONTS.SIZES.SM,
    marginBottom: SPACING.SM,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    fontSize: FONTS.SIZES.SM,
    marginRight: SPACING.SM,
  },
  urlButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: FONTS.SIZES.SM,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
    marginHorizontal: SPACING.LG,
    marginBottom: SPACING.SM,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: SPACING.LG,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: FONTS.SIZES.MD,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    marginBottom: SPACING.MD,
  },
  sheetItemSelected: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  sheetIconContainer: {
    marginRight: SPACING.MD,
  },
  sheetInfo: {
    flex: 1,
  },
  sheetName: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
    marginBottom: 2,
  },
  sheetMeta: {
    fontSize: FONTS.SIZES.SM,
  },
  selectedIndicator: {
    marginLeft: SPACING.SM,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyTitle: {
    fontSize: FONTS.SIZES.LG,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
    marginTop: SPACING.MD,
    marginBottom: SPACING.XS,
  },
  emptyDescription: {
    fontSize: FONTS.SIZES.SM,
    textAlign: 'center',
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
  columnSelectSection: {
    marginBottom: SPACING.LG,
  },
  columnSelectLabel: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
    marginBottom: SPACING.SM,
  },
  columnOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  columnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    marginRight: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  columnOptionSelected: {
    backgroundColor: `${COLORS.PRIMARY}20`,
  },
  columnOptionText: {
    fontSize: FONTS.SIZES.MD,
    marginRight: SPACING.XS,
  },
  confirmButton: {
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    marginTop: SPACING.MD,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: FONTS.SIZES.LG,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
});
