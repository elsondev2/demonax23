import { useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { ThemeContext } from "../contexts/ThemeContext";

function ThemeProvider({ children }) {
    const {
        currentTheme,
        setTheme,
        initializeTheme,
        getCurrentTheme,
        resetTheme,
        cleanup
    } = useThemeStore();

    // Initialize theme on mount and cleanup on unmount
    useEffect(() => {
        initializeTheme();
        
        // Cleanup system theme watcher on unmount
        return () => {
            cleanup();
        };
    }, [initializeTheme, cleanup]);

    // Apply theme changes to document
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", currentTheme);
    }, [currentTheme]);

    const themeContextValue = {
        currentTheme,
        setTheme,
        getCurrentTheme,
        resetTheme,
    };

    return (
        <ThemeContext.Provider value={themeContextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export default ThemeProvider;