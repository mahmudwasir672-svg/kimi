/**
 * SheetMail Sender - Login Screen
 * ================================
 * Google Sign-In screen with onboarding
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '@constants';
import { useAuthStore, useThemeStore } from '@store';
import { signInWithGoogle, configureGoogleSignIn } from '@services/auth';

// ============================================================================
// ONBOARDING STEPS
// ============================================================================

const ONBOARDING_STEPS = [
  {
    icon: 'google-spreadsheet',
    title: 'Connect Your Sheets',
    description: 'Import contacts directly from Google Sheets. No manual uploading needed.',
  },
  {
    icon: 'email-edit',
    title: 'Create Templates',
    description: 'Design beautiful emails with placeholders that auto-fill from your sheet data.',
  },
  {
    icon: 'send-circle',
    title: 'Send Campaigns',
    description: 'Send personalized emails at scale with automatic tracking and status updates.',
  },
];

// ============================================================================
// LOGIN SCREEN COMPONENT
// ============================================================================

export default function LoginScreen(): JSX.Element {
  const systemColorScheme = useColorScheme();
  const { theme } = useThemeStore();
  const { isLoading, error } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  
  useEffect(() => {
    configureGoogleSignIn();
  }, []);
  
  const handleSignIn = async () => {
    if (isSigningIn) return;
    
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };
  
  const handleNextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK]}
            style={styles.logoContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="email-send" size={48} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>
            SheetMail Sender
          </Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Send personalized emails from Google Sheets
          </Text>
        </View>
        
        {/* Onboarding Section */}
        <View style={styles.onboardingSection}>
          <View style={styles.stepIndicator}>
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      index === currentStep
                        ? COLORS.PRIMARY
                        : index < currentStep
                        ? COLORS.SUCCESS
                        : colors.border,
                  },
                ]}
              />
            ))}
          </View>
          
          <View style={styles.stepContent}>
            <Icon
              name={ONBOARDING_STEPS[currentStep].icon}
              size={64}
              color={COLORS.PRIMARY}
              style={styles.stepIcon}
            />
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
              {ONBOARDING_STEPS[currentStep].title}
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              {ONBOARDING_STEPS[currentStep].description}
            </Text>
          </View>
          
          <View style={styles.stepNavigation}>
            <TouchableOpacity
              onPress={handlePrevStep}
              disabled={currentStep === 0}
              style={[
                styles.navButton,
                currentStep === 0 && styles.navButtonDisabled,
              ]}
            >
              <Icon
                name="chevron-left"
                size={24}
                color={currentStep === 0 ? colors.textTertiary : colors.textPrimary}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleNextStep}
              disabled={currentStep === ONBOARDING_STEPS.length - 1}
              style={[
                styles.navButton,
                currentStep === ONBOARDING_STEPS.length - 1 && styles.navButtonDisabled,
              ]}
            >
              <Icon
                name="chevron-right"
                size={24}
                color={
                  currentStep === ONBOARDING_STEPS.length - 1
                    ? colors.textTertiary
                    : colors.textPrimary
                }
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Sign In Section */}
        <View style={styles.signInSection}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: COLORS.ERROR_50 }]}>
              <Icon name="alert-circle" size={20} color={COLORS.ERROR} />
              <Text style={[styles.errorText, { color: COLORS.ERROR }]}>{error}</Text>
            </View>
          )}
          
          <TouchableOpacity
            onPress={handleSignIn}
            disabled={isSigningIn || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK]}
              style={styles.signInButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSigningIn || isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon name="google" size={24} color="#FFF" />
                  <Text style={styles.signInButtonText}>Continue with Google</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={[styles.termsText, { color: colors.textTertiary }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
        
        {/* Features Section */}
        <View style={styles.featuresSection}>
          <FeatureItem
            icon="shield-check"
            title="Secure"
            description="Your data stays private and encrypted"
            colors={colors}
          />
          <FeatureItem
            icon="lightning-bolt"
            title="Fast"
            description="Send hundreds of emails in minutes"
            colors={colors}
          />
          <FeatureItem
            icon="chart-line"
            title="Trackable"
            description="Monitor delivery status in real-time"
            colors={colors}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// FEATURE ITEM COMPONENT
// ============================================================================

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
  colors: typeof lightColors;
}

function FeatureItem({ icon, title, description, colors }: FeatureItemProps): JSX.Element {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIconContainer, { backgroundColor: colors.surface }]}>
        <Icon name={icon} size={20} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.LG,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: SPACING.XL,
    marginBottom: SPACING.XL,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.XL,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  appName: {
    fontSize: FONTS.SIZES.XXXL,
    fontWeight: FONTS.WEIGHTS.BOLD,
    marginBottom: SPACING.XS,
  },
  tagline: {
    fontSize: FONTS.SIZES.MD,
    textAlign: 'center',
  },
  onboardingSection: {
    marginBottom: SPACING.XL,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.LG,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.FULL,
    marginHorizontal: SPACING.XS,
  },
  stepContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    minHeight: 180,
  },
  stepIcon: {
    marginBottom: SPACING.MD,
  },
  stepTitle: {
    fontSize: FONTS.SIZES.XL,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: FONTS.SIZES.MD,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.MD,
  },
  navButton: {
    padding: SPACING.SM,
    marginHorizontal: SPACING.SM,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  signInSection: {
    marginBottom: SPACING.XL,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
  },
  errorText: {
    fontSize: FONTS.SIZES.SM,
    marginLeft: SPACING.SM,
    flex: 1,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    gap: SPACING.SM,
  },
  signInButtonText: {
    color: '#FFF',
    fontSize: FONTS.SIZES.LG,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
  },
  termsText: {
    fontSize: FONTS.SIZES.XS,
    textAlign: 'center',
    marginTop: SPACING.MD,
  },
  featuresSection: {
    marginTop: 'auto',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FONTS.SIZES.MD,
    fontWeight: FONTS.WEIGHTS.SEMIBOLD,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: FONTS.SIZES.SM,
  },
});
