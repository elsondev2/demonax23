import { DEFAULT_THEME, isValidTheme, isDarkTheme } from "../constants/themes";

const THEME_STORAGE_KEY = "chat-theme";

/**
 * Detect system theme preference
 */
export const getSystemTheme = () => {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch (error) {
    console.warn("Failed to detect system theme:", error);
    return 'light';
  }
};

/**
 * Get theme from localStorage with fallback to system theme, then default
 */
export const getStoredTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isValidTheme(stored)) {
      return stored;
    }
    
    // If no stored theme, use system preference
    const systemTheme = getSystemTheme();
    return systemTheme === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.warn("Failed to get stored theme:", error);
    return DEFAULT_THEME;
  }
};

/**
 * Store theme in localStorage
 */
export const storeTheme = (themeName) => {
  try {
    if (!isValidTheme(themeName)) {
      console.warn("Invalid theme name:", themeName);
      return false;
    }
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
    return true;
  } catch (error) {
    console.warn("Failed to store theme:", error);
    return false;
  }
};

/**
 * Apply theme to HTML document
 */
export const applyThemeToDocument = (themeName) => {
  try {
    if (!isValidTheme(themeName)) {
      console.warn("Invalid theme name:", themeName);
      return false;
    }
    document.documentElement.setAttribute("data-theme", themeName);
    
    // Update favicon and browser theme
    import("./faviconUtils").then(({ updateBrowserTheme }) => {
      updateBrowserTheme(themeName);
    }).catch(() => {
      // Fallback if favicon utils fail to load
      console.warn("Failed to load favicon utils");
    });
    
    return true;
  } catch (error) {
    console.warn("Failed to apply theme to document:", error);
    return false;
  }
};

/**
 * Initialize theme system - get from storage and apply to document
 */
export const initializeTheme = () => {
  const theme = getStoredTheme();
  applyThemeToDocument(theme);
  return theme;
};

/**
 * Set theme with full persistence and document application
 */
export const setThemeComplete = (themeName) => {
  if (!isValidTheme(themeName)) {
    console.warn("Invalid theme name:", themeName);
    return false;
  }
  
  const stored = storeTheme(themeName);
  const applied = applyThemeToDocument(themeName);
  
  return stored && applied;
};

/**
 * Listen for system theme changes
 */
export const watchSystemTheme = (callback) => {
  try {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        const systemTheme = e.matches ? 'dark' : 'light';
        callback(systemTheme);
      };
      
      mediaQuery.addEventListener('change', handler);
      
      // Return cleanup function
      return () => mediaQuery.removeEventListener('change', handler);
    }
  } catch (error) {
    console.warn("Failed to watch system theme:", error);
  }
  
  return () => {}; // No-op cleanup
};