/**
 * SheetMail Sender - Dashboard Screen
 * ===================================
 * Main dashboard with stats and quick actions
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '@constants';
import { useAuthStore, useThemeStore, useCampaignsStore, useUIStore } from '@store';
import { analyticsApi } from '@services/api';
import type { RootStackParamList } from '@navigation/types';

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color: string;
  colors: typeof lightColors;
}

function StatCard({ icon, label, value, trend, trendUp, color, colors }: StatCardProps): JSX.Element {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }, SHADOWS.SM]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      {trend && (
        <View style={styles.trendContainer}>
          <Icon
            name={trendUp ? 'trending-up' : 'trending-down'}
            size={14}
            color={trendUp ? COLORS.SUCCESS : COLORS.ERROR}
          />
          <Text
            style={[
              styles.trendText,
              { color: trendUp ? COLORS.SUCCESS : COLORS.ERROR },
            ]}
          >
            {trend}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// QUICK ACTION BUTTON COMPONENT
// ============================================================================

interface QuickActionProps {
  icon: string;
  label: string;
  description: string;
  onPress: () => void;
  colors: typeof lightColors;
}

function QuickAction({ icon, label, description, onPress, colors }: QuickActionProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: colors.surface }, SHADOWS.SM]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.quickActionContent}>
        <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.PRIMARY}15` }]}>
          <Icon name={icon} size={24} color={COLORS.PRIMARY} />
        </View>
        <View style={styles.quickActionText}>
          <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>
            {label}
          </Text>
          <Text style={[styles.quickActionDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

// ============================================================================
// RECENT CAMPAIGN ITEM COMPONENT
// ============================================================================

interface RecentCampaignProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    sentCount: number;
    totalRecipients: number;
    createdAt: string;
  };
  colors: typeof lightColors;
  onPress: () => void;
}

function RecentCampaignItem({ campaign, colors, onPress }: RecentCampaignProps): JSX.Element {
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
      default:
        return COLORS.SECONDARY;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'sending':
        return 'send';
      case 'failed':
        return 'alert-circle';
      case 'paused':
        return 'pause-circle';
      default:
        return 'clock';
    }
  };
  
  const progress = Math.round((campaign.sentCount / campaign.totalRecipients) * 100);
  
  return (
    <TouchableOpacity
      style={[styles.campaignItem, { backgroundColor: colors.surface }, SHADOWS.SM]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.campaignHeader}>
        <View style={styles.campaignTitleRow}>
          <Icon
            name={getStatusIcon(campaign.status)}
            size={18}
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
          {new Date(campaign.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.campaignStats}>
        <Text style={[styles.campaignProgress, { color: colors.textSecondary }]}>
          {campaign.sentCount} / {campaign.totalRecipients} sent
        </Text>
        <Text style={[styles.campaignPercentage, { color: getStatusColor(campaign.status) }]}>
          {progress}%
        </Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progress}%`,
              backgroundColor: getStatusColor(campaign.status),
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// DASHBOARD SCREEN COMPONENT
// ============================================================================

interface DashboardStats {
  totalCampaigns: number;
  totalSent: number;
  totalFailed: number;
  averageSuccessRate: number;
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    sentCount: number;
    totalRecipients: number;
    createdAt: string;
  }>;
}

export default function DashboardScreen(): JSX.Element {
  const systemColorScheme = useColorScheme();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchStats = useCallback(async () => {
    try {
      const data = await analyticsApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      useUIStore.getState().showToast('Failed to load dashboard data', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };
  
  const handleNewCampaign = () => {
    navigation.navigate('SheetSelect');
  };
  
  const handleViewHistory = () => {
    navigation.navigate('History');
  };
  
  const handleViewTemplates = () => {
    navigation.navigate('Templates');
  };
  
  const handleCampaignPress = (campaignId: string) => {
    navigation.navigate('CampaignDetails', { campaignId });
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading dashboard...
        </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {user?.name?.split(' ')[0] || 'User'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="cog" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="email-send"
            label="Total Sent"
            value={stats?.totalSent.toLocaleString() || '0'}
            color={COLORS.PRIMARY}
            colors={colors}
          />
          <StatCard
            icon="bullhorn"
            label="Campaigns"
            value={stats?.totalCampaigns.toLocaleString() || '0'}
            color={COLORS.INFO}
            colors={colors}
          />
          <StatCard
            icon="check-circle"
            label="Success Rate"
            value={`${Math.round(stats?.averageSuccessRate || 0)}%`}
            color={COLORS.SUCCESS}
            colors={colors}
          />
          <StatCard
            icon="alert-circle"
            label="Failed"
            value={stats?.totalFailed.toLocaleString() || '0'}
            color={COLORS.ERROR}
            colors={colors}
          />
        </View>
        
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Quick Actions
          </Text>
          <QuickAction
            icon="plus-circle"
            label="New Campaign"
            description="Create a new email campaign"
            onPress={handleNewCampaign}
            colors={colors}
          />
          <QuickAction
            icon="history"
            label="Campaign History"
            description="View all your past campaigns"
            onPress={handleViewHistory}
            colors={colors}
          />
          <QuickAction
            icon="file-document"
            label="Templates"
            description="Manage email templates"
            onPress={handleViewTemplates}
            colors={colors}
          />
        </View>
        
        {/* Recent Campaigns */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Recent Campaigns
            </Text>
            <TouchableOpacity onPress={handleViewHistory}>
              <Text style={[styles.seeAllText, { color: COLORS.PRIMARY }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
            stats.recentCampaigns.map((campaign) => (
              <RecentCampaignItem
                key={campaign.id}
                campaign={campaign}
                colors={colors}
                onPress={() => handleCampaignPress(campaign.id)}
              />
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Icon name="email-off" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No campaigns yet
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textTertiary }]}>
                Create your first campaign to get started
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: FONTS.SIZES.MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
  },
  greeting: {
    fontSize: FONTS.SIZES.SM,
  },
  userName: {
    fontSize: FONTS.SIZES.XXL,
    fontWeight: FONTS.WEIGHTS.BOLD,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.FULL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.LG,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.XS,
    marginBottom: SPACING.LG,
  },
  statCard: {
    width: '46%',
    margin: SPACING.XS,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  statValue: {
    fontSize: FONTS.SIZES.XXXL,
    fontWeight: FONTS.WEIGHTS.BOLD,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONTS.SIZES.SM,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.XS,
  },
  trendText: {
    fontSize: FONTS.SIZES.XS,
    marginLeft: 2,
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONTS.SIZES.LG,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
  seeAllText: {
    fontSize: FONTS.SIZES.SM,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    marginBottom: SPACING.MD,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionLabel: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
    marginBottom: 2,
  },
  quickActionDescription: {
    fontSize: FONTS.SIZES.SM,
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
    marginBottom: SPACING.SM,
  },
  campaignTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  campaignName: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
    marginLeft: SPACING.XS,
    flex: 1,
  },
  campaignDate: {
    fontSize: FONTS.SIZES.XS,
  },
  campaignStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  campaignProgress: {
    fontSize: FONTS.SIZES.SM,
  },
  campaignPercentage: {
    fontSize: FONTS.SIZES.SM,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
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
  emptyState: {
    padding: SPACING.XL,
    borderRadius: BORDER_RADIUS.LG,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
    marginTop: SPACING.MD,
    marginBottom: SPACING.XS,
  },
  emptyDescription: {
    fontSize: FONTS.SIZES.SM,
    textAlign: 'center',
  },
});
