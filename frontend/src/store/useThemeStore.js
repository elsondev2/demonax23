import { create } from "zustand";
import { DEFAULT_THEME, isValidTheme } from "../constants/themes";
import { getStoredTheme, setThemeComplete, watchSystemTheme } from "../utils/themeUtils";

const THEME_STORAGE_KEY = "chat-app-theme";

export const useThemeStore = create((set, get) => ({
  // Theme state
  currentTheme: DEFAULT_THEME,
  isModalOpen: false,
  isChangingTheme: false,
  systemThemeWatcher: null,

  // Initialize theme with system detection
  initializeTheme: () => {
    try {
      // Get theme with system fallback
      const theme = getStoredTheme();
      set({ currentTheme: theme });
      
      // Apply theme to document and update favicon
      setThemeComplete(theme);

      // Watch for system theme changes
      const cleanup = watchSystemTheme((systemTheme) => {
        // Only auto-switch if user hasn't manually set a theme
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (!savedTheme) {
          const newTheme = systemTheme === 'dark' ? 'dark' : 'light';
          get().setTheme(newTheme);
        }
      });

      set({ systemThemeWatcher: cleanup });
    } catch (error) {
      console.error("Failed to initialize theme:", error);
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
    }
  },

  // Set theme
  setTheme: (themeName) => {
    if (!isValidTheme(themeName)) {
      console.error("Invalid theme:", themeName);
      return;
    }

    try {
      // Start loading
      set({ isChangingTheme: true });

      // Update state
      set({ currentTheme: themeName });

      // Use enhanced theme utilities
      setThemeComplete(themeName);

      // Stop loading after 0.75 seconds
      setTimeout(() => {
        set({ isChangingTheme: false });
      }, 750);
    } catch (error) {
      console.error("Failed to set theme:", error);
      set({ isChangingTheme: false });
    }
  },

  // Get current theme
  getCurrentTheme: () => {
    return get().currentTheme;
  },

  // Modal state management
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),

  // Reset to default theme
  resetTheme: () => {
    const { setTheme } = get();
    setTheme(DEFAULT_THEME);
  },

  // Cleanup system theme watcher
  cleanup: () => {
    const { systemThemeWatcher } = get();
    if (systemThemeWatcher) {
      systemThemeWatcher();
      set({ systemThemeWatcher: null });
    }
  },
}));