/**
 * SheetMail Sender - Sending Screen
 * =================================
 * Screen for showing campaign sending progress
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '@constants';
import { useThemeStore, useCampaignsStore, useUIStore } from '@store';
import { campaignsApi } from '@services/api';
import { subscribeToCampaignProgress } from '@services/firebase';
import type { RootStackParamList } from '@navigation/types';

// ============================================================================
// PROGRESS RING COMPONENT
// ============================================================================

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  colors: typeof lightColors;
}

function ProgressRing({
  progress,
  size = 150,
  strokeWidth = 12,
  colors,
}: ProgressRingProps): JSX.Element {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      {/* Background Circle */}
      <View
        style={[
          styles.progressRingBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.border,
          },
        ]}
      />
      
      {/* Progress Circle */}
      <View
        style={[
          styles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: COLORS.PRIMARY,
            borderTopColor: 'transparent',
            borderRightColor: progress < 25 ? 'transparent' : COLORS.PRIMARY,
            borderBottomColor: progress < 50 ? 'transparent' : COLORS.PRIMARY,
            borderLeftColor: progress < 75 ? 'transparent' : COLORS.PRIMARY,
            transform: [
              { rotate: `${-90 + (progress * 3.6)}deg` },
            ],
          },
        ]}
      />
      
      {/* Center Content */}
      <View style={styles.progressRingCenter}>
        <Text style={[styles.progressPercentage, { color: colors.textPrimary }]}>
          {Math.round(progress)}%
        </Text>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          Complete
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// STATUS CARD COMPONENT
// ============================================================================

interface StatusCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  colors: typeof lightColors;
}

function StatusCard({ icon, label, value, color, colors }: StatusCardProps): JSX.Element {
  return (
    <View style={[styles.statusCard, { backgroundColor: colors.surface }, SHADOWS.SM]}>
      <View style={[styles.statusIconContainer, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ============================================================================
// SENDING SCREEN COMPONENT
// ============================================================================

export default function SendingScreen(): JSX.Element {
  const systemColorScheme = useColorScheme();
  const { theme } = useThemeStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    currentCampaign,
    isSending,
    isPaused,
    sendProgress,
    setIsSending,
    setIsPaused,
    setSendProgress,
    updateCampaign,
  } = useCampaignsStore();
  
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [eta, setEta] = useState<string>('');
  const progressUnsubscribe = useRef<(() => void) | null>(null);
  const appState = useRef(AppState.currentState);
  
  // Subscribe to campaign progress updates
  useEffect(() => {
    if (!currentCampaign) return;
    
    // Start the campaign
    const startCampaign = async () => {
      try {
        setIsSending(true);
        await campaignsApi.sendCampaign(currentCampaign.id);
      } catch (error) {
        console.error('Failed to start campaign:', error);
        useUIStore.getState().showToast('Failed to start campaign', 'error');
      }
    };
    
    startCampaign();
    
    // Subscribe to progress updates
    progressUnsubscribe.current = subscribeToCampaignProgress(
      currentCampaign.id,
      (progress) => {
        setSendProgress({
          current: progress.current || 0,
          total: progress.total || currentCampaign.totalRecipients,
          percentage: progress.percentage || 0,
          currentEmail: progress.currentEmail,
          status: progress.status,
          rateLimited: progress.rateLimited || false,
          nextRetryAt: progress.nextRetryAt ? new Date(progress.nextRetryAt) : undefined,
        });
        
        if (progress.currentEmail) {
          setCurrentEmail(progress.currentEmail);
        }
        
        // Update campaign stats
        if (progress.sentCount !== undefined) {
          updateCampaign(currentCampaign.id, {
            sentCount: progress.sentCount,
            failedCount: progress.failedCount || 0,
            progress: progress.percentage || 0,
          });
        }
        
        // Calculate ETA
        if (progress.current > 0 && progress.total > 0) {
          const remaining = progress.total - progress.current;
          const secondsRemaining = remaining * 2; // 2 seconds per email
          const minutes = Math.ceil(secondsRemaining / 60);
          setEta(minutes <= 1 ? '< 1 min' : `~${minutes} mins`);
        }
        
        // Check if completed
        if (progress.status === 'completed') {
          setIsSending(false);
          useUIStore.getState().showToast('Campaign completed!', 'success');
          
          // Navigate to history after a delay
          setTimeout(() => {
            navigation.navigate('History');
          }, 2000);
        }
      },
      (error) => {
        console.error('Progress subscription error:', error);
      }
    );
    
    return () => {
      if (progressUnsubscribe.current) {
        progressUnsubscribe.current();
      }
    };
  }, [currentCampaign, setIsSending, setSendProgress, updateCampaign, navigation]);
  
  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh progress
        if (currentCampaign) {
          campaignsApi.getSendProgress(currentCampaign.id).then((progress) => {
            setSendProgress({
              current: progress.current,
              total: progress.total,
              percentage: progress.percentage,
              currentEmail: progress.currentEmail,
              status: progress.status as 'running' | 'paused' | 'completed' | 'failed',
              rateLimited: progress.rateLimited,
              nextRetryAt: progress.nextRetryAt ? new Date(progress.nextRetryAt) : undefined,
            });
          });
        }
      }
      appState.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, [currentCampaign, setSendProgress]);
  
  const handlePause = async () => {
    if (!currentCampaign) return;
    
    try {
      await campaignsApi.pauseCampaign(currentCampaign.id);
      setIsPaused(true);
      useUIStore.getState().showToast('Campaign paused', 'info');
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      useUIStore.getState().showToast('Failed to pause campaign', 'error');
    }
  };
  
  const handleResume = async () => {
    if (!currentCampaign) return;
    
    try {
      await campaignsApi.resumeCampaign(currentCampaign.id);
      setIsPaused(false);
      useUIStore.getState().showToast('Campaign resumed', 'success');
    } catch (error) {
      console.error('Failed to resume campaign:', error);
      useUIStore.getState().showToast('Failed to resume campaign', 'error');
    }
  };
  
  const handleStop = async () => {
    if (!currentCampaign) return;
    
    Alert.alert(
      'Stop Campaign',
      'Are you sure you want to stop this campaign? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              await campaignsApi.stopCampaign(currentCampaign.id);
              setIsSending(false);
              useUIStore.getState().showToast('Campaign stopped', 'info');
              navigation.navigate('History');
            } catch (error) {
              console.error('Failed to stop campaign:', error);
              useUIStore.getState().showToast('Failed to stop campaign', 'error');
            }
          },
        },
      ]
    );
  };
  
  if (!currentCampaign) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={COLORS.ERROR} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
            No active campaign
          </Text>
          <TouchableOpacity
            style={[styles.errorButton, { backgroundColor: COLORS.PRIMARY }]}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.errorButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const progress = sendProgress?.percentage || 0;
  const current = sendProgress?.current || 0;
  const total = sendProgress?.total || currentCampaign.totalRecipients;
  const sentCount = currentCampaign.sentCount || 0;
  const failedCount = currentCampaign.failedCount || 0;
  const skippedCount = currentCampaign.skippedCount || 0;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Sending Campaign
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Icon name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Ring */}
        <View style={styles.progressSection}>
          <ProgressRing progress={progress} colors={colors} />
          
          {sendProgress?.rateLimited && (
            <View style={[styles.rateLimitBanner, { backgroundColor: COLORS.WARNING_50 }]}>
              <Icon name="clock-alert" size={20} color={COLORS.WARNING} />
              <Text style={[styles.rateLimitText, { color: COLORS.WARNING_DARK }]}>
                Rate limited. Resuming shortly...
              </Text>
            </View>
          )}
          
          {currentEmail && (
            <View style={styles.currentEmailContainer}>
              <Text style={[styles.currentEmailLabel, { color: colors.textSecondary }]}>
                Currently sending to:
              </Text>
              <Text style={[styles.currentEmail, { color: colors.textPrimary }]} numberOfLines={1}>
                {currentEmail}
              </Text>
            </View>
          )}
        </View>
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatusCard
            icon="email-send"
            label="Sent"
            value={sentCount}
            color={COLORS.SUCCESS}
            colors={colors}
          />
          <StatusCard
            icon="alert-circle"
            label="Failed"
            value={failedCount}
            color={failedCount > 0 ? COLORS.ERROR : COLORS.SUCCESS}
            colors={colors}
          />
          <StatusCard
            icon="skip-forward"
            label="Skipped"
            value={skippedCount}
            color={COLORS.SECONDARY}
            colors={colors}
          />
        </View>
        
        {/* Campaign Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }, SHADOWS.SM]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Campaign
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>
              {currentCampaign.name}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Progress
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {current} / {total}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Est. Time Remaining
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {eta || 'Calculating...'}
            </Text>
          </View>
        </View>
        
        {/* Status Message */}
        <View style={[styles.statusMessage, { backgroundColor: colors.surface }, SHADOWS.SM]}>
          <Icon
            name={isPaused ? 'pause-circle' : isSending ? 'sync' : 'check-circle'}
            size={24}
            color={isPaused ? COLORS.WARNING : isSending ? COLORS.PRIMARY : COLORS.SUCCESS}
          />
          <Text style={[styles.statusMessageText, { color: colors.textPrimary }]}>
            {isPaused
              ? 'Campaign paused'
              : isSending
              ? 'Sending emails...'
              : 'Campaign completed'}
          </Text>
          {isSending && !isPaused && (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} style={{ marginLeft: SPACING.SM }} />
          )}
        </View>
      </ScrollView>
      
      {/* Control Buttons */}
      <View style={[styles.controls, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {isSending && (
          <>
            {isPaused ? (
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: COLORS.SUCCESS }]}
                onPress={handleResume}
              >
                <Icon name="play" size={20} color="#FFF" />
                <Text style={styles.controlButtonText}>Resume</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: COLORS.WARNING }]}
                onPress={handlePause}
              >
                <Icon name="pause" size={20} color="#FFF" />
                <Text style={styles.controlButtonText}>Pause</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: COLORS.ERROR }]}
              onPress={handleStop}
            >
              <Icon name="stop" size={20} color="#FFF" />
              <Text style={styles.controlButtonText}>Stop</Text>
            </TouchableOpacity>
          </>
        )}
        
        {!isSending && progress >= 100 && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: COLORS.PRIMARY, flex: 1 }]}
            onPress={() => navigation.navigate('History')}
          >
            <Icon name="history" size={20} color="#FFF" />
            <Text style={styles.controlButtonText}>View History</Text>
          </TouchableOpacity>
        )}
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
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  progressRingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingBackground: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  progressRingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: FONTS.SIZES.DISPLAY,
    fontWeight: FONTS.WEIGHTS.BOLD,
  },
  progressLabel: {
    fontSize: FONTS.SIZES.SM,
  },
  rateLimitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: SPACING.MD,
  },
  rateLimitText: {
    fontSize: FONTS.SIZES.SM,
    marginLeft: SPACING.SM,
  },
  currentEmailContainer: {
    alignItems: 'center',
    marginTop: SPACING.MD,
  },
  currentEmailLabel: {
    fontSize: FONTS.SIZES.SM,
    marginBottom: SPACING.XS,
  },
  currentEmail: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  statusCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    marginHorizontal: SPACING.XS,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  statusValue: {
    fontSize: FONTS.SIZES.XXL,
    fontWeight: FONTS.WEIGHTS.BOLD,
    marginBottom: 2,
  },
  statusLabel: {
    fontSize: FONTS.SIZES.XS,
  },
  infoCard: {
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    marginBottom: SPACING.LG,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: FONTS.SIZES.SM,
  },
  infoValue: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
    flex: 1,
    textAlign: 'right',
    marginLeft: SPACING.MD,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
  },
  statusMessageText: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.MEDIUM,
    marginLeft: SPACING.SM,
  },
  controls: {
    flexDirection: 'row',
    padding: SPACING.LG,
    borderTopWidth: 1,
    gap: SPACING.MD,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    gap: SPACING.SM,
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: FONTS.SIZES.MD,
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
