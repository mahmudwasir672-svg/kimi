/**
 * SheetMail Sender - Main App
 * ===========================
 * Root application component
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import AppNavigation from '@navigation';

// ============================================================================
// TOAST CONFIG
// ============================================================================

const toastConfig = {
  success: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={toastStyles.container}>
      <View style={[toastStyles.content, toastStyles.success]}>
        <View style={toastStyles.iconContainer}>
          <Text style={toastStyles.icon}>✓</Text>
        </View>
        <View style={toastStyles.textContainer}>
          {text1 && <Text style={toastStyles.title}>{text1}</Text>}
          {text2 && <Text style={toastStyles.message}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
  error: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={toastStyles.container}>
      <View style={[toastStyles.content, toastStyles.error]}>
        <View style={toastStyles.iconContainer}>
          <Text style={toastStyles.icon}>✕</Text>
        </View>
        <View style={toastStyles.textContainer}>
          {text1 && <Text style={toastStyles.title}>{text1}</Text>}
          {text2 && <Text style={toastStyles.message}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
  info: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={toastStyles.container}>
      <View style={[toastStyles.content, toastStyles.info]}>
        <View style={toastStyles.iconContainer}>
          <Text style={toastStyles.icon}>ℹ</Text>
        </View>
        <View style={toastStyles.textContainer}>
          {text1 && <Text style={toastStyles.title}>{text1}</Text>}
          {text2 && <Text style={toastStyles.message}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
  warning: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={toastStyles.container}>
      <View style={[toastStyles.content, toastStyles.warning]}>
        <View style={toastStyles.iconContainer}>
          <Text style={toastStyles.icon}>⚠</Text>
        </View>
        <View style={toastStyles.textContainer}>
          {text1 && <Text style={toastStyles.title}>{text1}</Text>}
          {text2 && <Text style={toastStyles.message}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigation />
      <Toast config={toastConfig} position="top" topOffset={60} />
    </SafeAreaProvider>
  );
}

// ============================================================================
// TOAST STYLES
// ============================================================================

const toastStyles = {
  container: {
    width: '90%',
    alignSelf: 'center' as const,
    marginTop: 10,
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  success: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  error: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  info: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  warning: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
  },
};
