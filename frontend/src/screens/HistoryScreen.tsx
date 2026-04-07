/**
 * SheetMail Sender - History Screen
 * =================================
 * Screen for viewing campaign history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
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
import { useThemeStore, useCampaignsStore, useUIStore } from '@store';
import { campaignsApi } from '@services/api';
import { formatDate } from '@utils';
import type { RootStackParamList } from '@navigation/types';
import type { Campaign } from '@types';

// ============================================================================
// CAMPAIGN ITEM COMPONENT
// ============================================================================

interface CampaignItemProps {
  campaign: Campaign;
  onPress: () => void;
  onDelete: () => void;
  colors: typeof lightColors;
}

function CampaignItem({ campaign, onPress, onDelete, colors }: CampaignItemProps): JSX.Element {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.SUCCESS;
      case 'sending':
        return COLORS.PRIMARY;
      case 'failed':
        return COLORS.ERROR;
      case 'paused':
        return COLORS.WARNING;
      case 'draft':
        return COLORS.SECONDARY;
      default:
        return COLORS.SECONDARY;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'sending':
        return 'sync';
      case 'failed':
        return 'alert-circle';
      case 'paused':
        return 'pause-circle';
      case 'draft':
        return 'file-document';
      default:
        return 'clock';
    }
  };
  
  const successRate = campaign.totalRecipients > 0
    ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
    : 0;
  
  return (
    <TouchableOpacity
      style={[styles.campaignItem, { backgroundColor: colors.surface }, SHADOWS.SM]}
      onPress={onPress}
      onLongPress={() => {
        Alert.alert(
          'Campaign Options',
          campaign.name,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ]
        );
      }}
      activeOpacity={0.8}
    >
      <View style={styles.campaignHeader}>
        <View style={styles.campaignTitleSection}>
          <Icon
            name={getStatusIcon(campaign.status)}
            size={20}
            color={getStatusColor(campaign.status)}
          />
          <Text
            style={[styles.campaignName, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {campaign.name}
          </Text>
        </View>
        <Text style={[styles.campaignDate, { color: colors.textTertiary }]}>
          {formatDate(campaign.createdAt)}
        </Text>
      </View>
      
      <View style={styles.campaignStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {campaign.sentCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {campaign.failedCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Failed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {successRate}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Success</Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${campaign.progress}%`,
              backgroundColor: getStatusColor(campaign.status),
            },
          ]}
        />
      </View>
      
      {campaign.status === 'sending' && (
        <View style={styles.sendingIndicator}>
          <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          <Text style={[styles.sendingText, { color: colors.textSecondary }]}>
            Sending in progress...
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  colors: typeof lightColors;
  onCreateCampaign: () => void;
}

function EmptyState({ colors, onCreateCampaign }: EmptyStateProps): JSX.Element {
  return (
    <View style={styles.emptyContainer}>
      <Icon name="email-off" size={80} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No campaigns yet
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        Create your first email campaign to get started
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: COLORS.PRIMARY }]}
        onPress={onCreateCampaign}
      >
        <Icon name="plus" size={20} color="#FFF" />
        <Text style={styles.emptyButtonText}>Create Campaign</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// HISTORY SCREEN COMPONENT
// ============================================================================

export default function HistoryScreen(): JSX.Element {
  const systemColorScheme = useColorScheme();
  const { theme } = useThemeStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { campaigns, setCampaigns, setLoadingCampaigns, setCampaignsError } = useCampaignsStore();
  
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  const fetchCampaigns = useCallback(async (reset = false) => {
    if (reset) {
      setOffset(0);
    }
    
    try {
      const response = await campaignsApi.getCampaigns(undefined, 20, reset ? 0 : offset);
      
      if (reset) {
        setCampaigns(response.campaigns);
      } else {
        setCampaigns([...campaigns, ...response.campaigns]);
      }
      
      setHasMore(response.hasMore);
      setOffset((reset ? 0 : offset) + response.campaigns.length);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      setCampaignsError('Failed to load campaigns');
      useUIStore.getState().showToast('Failed to load campaigns', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [campaigns, offset, setCampaigns, setCampaignsError]);
  
  useEffect(() => {
    fetchCampaigns(true);
  }, []);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCampaigns(true);
  };
  
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchCampaigns();
    }
  };
  
  const handleCampaignPress = (campaign: Campaign) => {
    navigation.navigate('CampaignDetails', { campaignId: campaign.id });
  };
  
  const handleDeleteCampaign = async (campaignId: string) => {
    Alert.alert(
      'Delete Campaign',
      'Are you sure you want to delete this campaign? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await campaignsApi.deleteCampaign(campaignId);
              setCampaigns(campaigns.filter(c => c.id !== campaignId));
              useUIStore.getState().showToast('Campaign deleted', 'success');
            } catch (error) {
              console.error('Failed to delete campaign:', error);
              useUIStore.getState().showToast('Failed to delete campaign', 'error');
            }
          },
        },
      ]
    );
  };
  
  const handleCreateCampaign = () => {
    navigation.navigate('SheetSelect');
  };
  
  const renderCampaignItem = ({ item }: { item: Campaign }) => (
    <CampaignItem
      campaign={item}
      onPress={() => handleCampaignPress(item)}
      onDelete={() => handleDeleteCampaign(item.id)}
      colors={colors}
    />
  );
  
  const renderFooter = () => {
    if (!isLoading || campaigns.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
      </View>
    );
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
          Campaign History
        </Text>
        <TouchableOpacity onPress={handleCreateCampaign}>
          <Icon name="plus" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
      
      {/* Campaign List */}
      {isLoading && campaigns.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading campaigns...
          </Text>
        </View>
      ) : (
        <FlatList
          data={campaigns}
          renderItem={renderCampaignItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.PRIMARY}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <EmptyState colors={colors} onCreateCampaign={handleCreateCampaign} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: FONTS.SIZES.MD,
  },
  listContent: {
    padding: SPACING.LG,
    paddingTop: 0,
  },
  campaignItem: {
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    marginBottom: SPACING.MD,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  campaignTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  campaignName: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
    marginLeft: SPACING.SM,
    flex: 1,
  },
  campaignDate: {
    fontSize: FONTS.SIZES.XS,
  },
  campaignStats: {
    flexDirection: 'row',
    marginBottom: SPACING.MD,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS.SIZES.LG,
    fontWeight: FONTS.WEIGHTS.BOLD,
  },
  statLabel: {
    fontSize: FONTS.SIZES.XS,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: BORDER_RADIUS.FULL,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.FULL,
  },
  sendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.MD,
  },
  sendingText: {
    fontSize: FONTS.SIZES.SM,
    marginLeft: SPACING.SM,
  },
  footerLoader: {
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyTitle: {
    fontSize: FONTS.SIZES.XL,
    fontWeight: FONTS.WEIGHTS.BOLD,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  emptyDescription: {
    fontSize: FONTS.SIZES.MD,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    gap: SPACING.SM,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
});
