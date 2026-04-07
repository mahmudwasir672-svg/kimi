/**
 * SheetMail Sender - State Management (Zustand)
 * =============================================
 * Central state management using Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  User,
  AuthState,
  GoogleSheet,
  SheetData,
  EmailTemplate,
  Campaign,
  CampaignDetails,
  SendProgress,
  Theme,
  LoadingState,
} from '@types';

// ============================================================================
// AUTH STORE
// ============================================================================

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      logout: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates, updatedAt: new Date() },
          });
        }
      },
    }),
    {
      name: '@sheetmail_auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ============================================================================
// THEME STORE
// ============================================================================

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      isDark: false,

      setTheme: (theme) => set({ theme, isDark: theme === 'dark' }),

      toggleTheme: () => set((state) => {
        const newTheme = state.isDark ? 'light' : 'dark';
        return { theme: newTheme, isDark: !state.isDark };
      }),
    }),
    {
      name: '@sheetmail_theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================================================
// SHEETS STORE
// ============================================================================

interface SheetsState {
  // Data
  sheets: GoogleSheet[];
  selectedSheet: GoogleSheet | null;
  sheetData: SheetData | null;
  columnMapping: Record<string, string>;
  
  // Loading states
  isLoadingSheets: boolean;
  isLoadingSheetData: boolean;
  
  // Errors
  sheetsError: string | null;
  sheetDataError: string | null;
  
  // Actions
  setSheets: (sheets: GoogleSheet[]) => void;
  setSelectedSheet: (sheet: GoogleSheet | null) => void;
  setSheetData: (data: SheetData | null) => void;
  setColumnMapping: (mapping: Record<string, string>) => void;
  setLoadingSheets: (loading: boolean) => void;
  setLoadingSheetData: (loading: boolean) => void;
  setSheetsError: (error: string | null) => void;
  setSheetDataError: (error: string | null) => void;
  clearSheetData: () => void;
  reset: () => void;
}

export const useSheetsStore = create<SheetsState>()((set) => ({
  sheets: [],
  selectedSheet: null,
  sheetData: null,
  columnMapping: {},
  isLoadingSheets: false,
  isLoadingSheetData: false,
  sheetsError: null,
  sheetDataError: null,

  setSheets: (sheets) => set({ sheets, isLoadingSheets: false, sheetsError: null }),
  setSelectedSheet: (selectedSheet) => set({ selectedSheet }),
  setSheetData: (sheetData) => set({ sheetData, isLoadingSheetData: false, sheetDataError: null }),
  setColumnMapping: (columnMapping) => set({ columnMapping }),
  setLoadingSheets: (isLoadingSheets) => set({ isLoadingSheets }),
  setLoadingSheetData: (isLoadingSheetData) => set({ isLoadingSheetData }),
  setSheetsError: (sheetsError) => set({ sheetsError, isLoadingSheets: false }),
  setSheetDataError: (sheetDataError) => set({ sheetDataError, isLoadingSheetData: false }),
  clearSheetData: () => set({ sheetData: null, columnMapping: {} }),
  reset: () => set({
    sheets: [],
    selectedSheet: null,
    sheetData: null,
    columnMapping: {},
    isLoadingSheets: false,
    isLoadingSheetData: false,
    sheetsError: null,
    sheetDataError: null,
  }),
}));

// ============================================================================
// TEMPLATES STORE
// ============================================================================

interface TemplatesState {
  // Data
  templates: EmailTemplate[];
  selectedTemplate: EmailTemplate | null;
  draftTemplate: Partial<EmailTemplate> | null;
  
  // Editor state
  subject: string;
  body: string;
  placeholders: string[];
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Errors
  error: string | null;
  
  // Actions
  setTemplates: (templates: EmailTemplate[]) => void;
  addTemplate: (template: EmailTemplate) => void;
  updateTemplate: (id: string, updates: Partial<EmailTemplate>) => void;
  deleteTemplate: (id: string) => void;
  selectTemplate: (template: EmailTemplate | null) => void;
  setDraftTemplate: (template: Partial<EmailTemplate> | null) => void;
  setSubject: (subject: string) => void;
  setBody: (body: string) => void;
  setPlaceholders: (placeholders: string[]) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  resetEditor: () => void;
}

export const useTemplatesStore = create<TemplatesState>()((set, get) => ({
  templates: [],
  selectedTemplate: null,
  draftTemplate: null,
  subject: '',
  body: '',
  placeholders: [],
  isLoading: false,
  isSaving: false,
  error: null,

  setTemplates: (templates) => set({ templates, isLoading: false, error: null }),
  
  addTemplate: (template) => set((state) => ({
    templates: [template, ...state.templates],
  })),
  
  updateTemplate: (id, updates) => set((state) => ({
    templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t),
  })),
  
  deleteTemplate: (id) => set((state) => ({
    templates: state.templates.filter(t => t.id !== id),
  })),
  
  selectTemplate: (template) => set({
    selectedTemplate: template,
    subject: template?.subject || '',
    body: template?.body || '',
    placeholders: template?.placeholders || [],
  }),
  
  setDraftTemplate: (template) => set({ draftTemplate: template }),
  setSubject: (subject) => set({ subject }),
  setBody: (body) => set({ body }),
  setPlaceholders: (placeholders) => set({ placeholders }),
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error, isLoading: false, isSaving: false }),
  
  resetEditor: () => set({
    subject: '',
    body: '',
    placeholders: [],
    selectedTemplate: null,
    draftTemplate: null,
  }),
}));

// ============================================================================
// CAMPAIGNS STORE
// ============================================================================

interface CampaignsState {
  // Data
  campaigns: Campaign[];
  selectedCampaign: CampaignDetails | null;
  currentCampaign: Campaign | null;
  
  // Sending state
  sendProgress: SendProgress | null;
  isSending: boolean;
  isPaused: boolean;
  
  // Loading states
  isLoadingCampaigns: boolean;
  isLoadingDetails: boolean;
  isCreating: boolean;
  
  // Errors
  campaignsError: string | null;
  detailsError: string | null;
  sendError: string | null;
  
  // Actions
  setCampaigns: (campaigns: Campaign[]) => void;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  setSelectedCampaign: (campaign: CampaignDetails | null) => void;
  setCurrentCampaign: (campaign: Campaign | null) => void;
  setSendProgress: (progress: SendProgress | null) => void;
  setIsSending: (isSending: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;
  setLoadingCampaigns: (loading: boolean) => void;
  setLoadingDetails: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setCampaignsError: (error: string | null) => void;
  setDetailsError: (error: string | null) => void;
  setSendError: (error: string | null) => void;
  incrementSentCount: () => void;
  incrementFailedCount: () => void;
  resetSendState: () => void;
}

export const useCampaignsStore = create<CampaignsState>()((set, get) => ({
  campaigns: [],
  selectedCampaign: null,
  currentCampaign: null,
  sendProgress: null,
  isSending: false,
  isPaused: false,
  isLoadingCampaigns: false,
  isLoadingDetails: false,
  isCreating: false,
  campaignsError: null,
  detailsError: null,
  sendError: null,

  setCampaigns: (campaigns) => set({ campaigns, isLoadingCampaigns: false, campaignsError: null }),
  
  addCampaign: (campaign) => set((state) => ({
    campaigns: [campaign, ...state.campaigns],
  })),
  
  updateCampaign: (id, updates) => set((state) => ({
    campaigns: state.campaigns.map(c => c.id === id ? { ...c, ...updates } : c),
    selectedCampaign: state.selectedCampaign?.id === id
      ? { ...state.selectedCampaign, ...updates }
      : state.selectedCampaign,
    currentCampaign: state.currentCampaign?.id === id
      ? { ...state.currentCampaign, ...updates }
      : state.currentCampaign,
  })),
  
  setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),
  setCurrentCampaign: (campaign) => set({ currentCampaign: campaign }),
  setSendProgress: (progress) => set({ sendProgress: progress }),
  setIsSending: (isSending) => set({ isSending }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setLoadingCampaigns: (isLoadingCampaigns) => set({ isLoadingCampaigns }),
  setLoadingDetails: (isLoadingDetails) => set({ isLoadingDetails }),
  setCreating: (isCreating) => set({ isCreating }),
  setCampaignsError: (campaignsError) => set({ campaignsError, isLoadingCampaigns: false }),
  setDetailsError: (detailsError) => set({ detailsError, isLoadingDetails: false }),
  setSendError: (sendError) => set({ sendError }),
  
  incrementSentCount: () => {
    const current = get().currentCampaign;
    if (current) {
      get().updateCampaign(current.id, {
        sentCount: current.sentCount + 1,
        progress: Math.round(((current.sentCount + 1) / current.totalRecipients) * 100),
      });
    }
  },
  
  incrementFailedCount: () => {
    const current = get().currentCampaign;
    if (current) {
      get().updateCampaign(current.id, {
        failedCount: current.failedCount + 1,
      });
    }
  },
  
  resetSendState: () => set({
    sendProgress: null,
    isSending: false,
    isPaused: false,
    sendError: null,
  }),
}));

// ============================================================================
// UI STORE (Loading, Toast, etc.)
// ============================================================================

interface UIState {
  // Loading states
  globalLoading: LoadingState;
  
  // Toast
  toastVisible: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info' | 'warning';
  
  // Bottom sheet
  bottomSheetVisible: boolean;
  bottomSheetContent: string | null;
  
  // Actions
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  updateLoadingProgress: (progress: number) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
  showBottomSheet: (content: string) => void;
  hideBottomSheet: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  globalLoading: { isLoading: false },
  toastVisible: false,
  toastMessage: '',
  toastType: 'info',
  bottomSheetVisible: false,
  bottomSheetContent: null,

  showLoading: (message) => set({
    globalLoading: { isLoading: true, message },
  }),
  
  hideLoading: () => set({
    globalLoading: { isLoading: false },
  }),
  
  updateLoadingProgress: (progress) => set((state) => ({
    globalLoading: { ...state.globalLoading, progress },
  })),
  
  showToast: (message, type = 'info') => set({
    toastVisible: true,
    toastMessage: message,
    toastType: type,
  }),
  
  hideToast: () => set({ toastVisible: false }),
  
  showBottomSheet: (content) => set({
    bottomSheetVisible: true,
    bottomSheetContent: content,
  }),
  
  hideBottomSheet: () => set({
    bottomSheetVisible: false,
    bottomSheetContent: null,
  }),
}));

// ============================================================================
// ONBOARDING STORE
// ============================================================================

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  setCompleted: (completed: boolean) => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      currentStep: 0,
      
      setCompleted: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      reset: () => set({ hasCompletedOnboarding: false, currentStep: 0 }),
    }),
    {
      name: '@sheetmail_onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
