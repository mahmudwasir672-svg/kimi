/**
 * SheetMail Sender - Navigation
 * =============================
 * Main navigation configuration
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useAuthStore } from '@store';
import { initializeFirebase, setupAuthListener } from '@services/firebase';
import { configureGoogleSignIn } from '@services/auth';

// Screens
import LoginScreen from '@screens/LoginScreen';
import DashboardScreen from '@screens/DashboardScreen';
import SheetSelectScreen from '@screens/SheetSelectScreen';
import TemplateEditorScreen from '@screens/TemplateEditorScreen';
import CampaignPreviewScreen from '@screens/CampaignPreviewScreen';
import SendingScreen from '@screens/SendingScreen';
import HistoryScreen from '@screens/HistoryScreen';

import type { RootStackParamList } from './types';

// ============================================================================
// STACK NAVIGATOR
// ============================================================================

const Stack = createNativeStackNavigator<RootStackParamList>();

// ============================================================================
// AUTHENTICATED STACK
// ============================================================================

function AuthenticatedStack(): JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="SheetSelect" component={SheetSelectScreen} />
      <Stack.Screen name="TemplateEditor" component={TemplateEditorScreen} />
      <Stack.Screen name="CampaignPreview" component={CampaignPreviewScreen} />
      <Stack.Screen name="Sending" component={SendingScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
    </Stack.Navigator>
  );
}

// ============================================================================
// UNAUTHENTICATED STACK
// ============================================================================

function UnauthenticatedStack(): JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// ============================================================================
// ROOT NAVIGATION
// ============================================================================

function RootNavigation(): JSX.Element {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedStack /> : <UnauthenticatedStack />}
    </NavigationContainer>
  );
}

// ============================================================================
// APP NAVIGATION (with initialization)
// ============================================================================

export default function AppNavigation(): JSX.Element {
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Firebase
        initializeFirebase();
        
        // Configure Google Sign-In
        configureGoogleSignIn();
        
        // Set up auth state listener
        const unsubscribe = setupAuthListener();
        
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initialize();
  }, []);
  
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }
  
  return <RootNavigation />;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
