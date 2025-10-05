import { isDarkTheme } from "../constants/themes";

/**
 * Update favicon based on current theme
 */
export const updateFavicon = (themeName) => {
  try {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      // Use light logo for dark themes, dark logo for light themes
      const faviconPath = isDarkTheme(themeName) 
        ? "/assets/lightlogo.png" 
        : "/assets/darklogo.png";
      
      favicon.href = faviconPath;
    }
  } catch (error) {
    console.warn("Failed to update favicon:", error);
  }
};

/**
 * Update theme color meta tag for browser UI
 */
export const updateThemeColor = (themeName) => {
  try {
    // Remove existing theme-color meta tag
    const existingThemeColor = document.querySelector('meta[name="theme-color"]');
    if (existingThemeColor) {
      existingThemeColor.remove();
    }

    // Add new theme-color meta tag
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    
    // Set theme color based on theme type
    if (isDarkTheme(themeName)) {
      meta.content = '#1f2937'; // Dark theme color
    } else {
      meta.content = '#ffffff'; // Light theme color
    }
    
    document.head.appendChild(meta);
  } catch (error) {
    console.warn("Failed to update theme color:", error);
  }
};

/**
 * Update both favicon and theme color
 */
export const updateBrowserTheme = (themeName) => {
  updateFavicon(themeName);
  updateThemeColor(themeName);
};