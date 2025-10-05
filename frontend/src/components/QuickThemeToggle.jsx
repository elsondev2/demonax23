import { useState, useEffect } from "react";
import { Palette, Sun, Moon, Monitor, Sparkles, Zap } from "lucide-react";
import { getSystemTheme } from "../utils/themeUtils";
import { useThemeStore } from "../store/useThemeStore";

// Top 5 best themes for quick access
const QUICK_THEMES = [
  {
    name: "light",
    displayName: "Light",
    icon: Sun,
    colors: { primary: "#570df8", base: "#ffffff", content: "#1f2937" }
  },
  {
    name: "dark", 
    displayName: "Dark",
    icon: Moon,
    colors: { primary: "#661ae6", base: "#2a303c", content: "#a6adbb" }
  },
  {
    name: "synthwave",
    displayName: "Synthwave",
    icon: Zap,
    colors: { primary: "#e779c1", base: "#1d1536", content: "#f9f7fd" }
  },
  {
    name: "dracula",
    displayName: "Dracula", 
    icon: Sparkles,
    colors: { primary: "#ff79c6", base: "#282a36", content: "#f8f8f2" }
  },
  {
    name: "cyberpunk",
    displayName: "Cyberpunk",
    icon: Palette,
    colors: { primary: "#ff7598", base: "#ffee00", content: "#000000" }
  }
];

function QuickThemeToggle({ className = "" }) {
  const { currentTheme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme());

  useEffect(() => {
    // Watch for system theme changes
    const cleanup = () => {
      try {
        if (window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
          mediaQuery.addEventListener('change', handler);
          return () => mediaQuery.removeEventListener('change', handler);
        }
      } catch (error) {
        console.warn("Failed to watch system theme:", error);
      }
      return () => {};
    };

    return cleanup();
  }, []);

  const handleThemeChange = (themeName) => {
    setTheme(themeName);
    setIsOpen(false);
  };

  const handleSystemTheme = () => {
    const theme = systemTheme === 'dark' ? 'dark' : 'light';
    handleThemeChange(theme);
  };

  const getCurrentThemeData = () => {
    return QUICK_THEMES.find(theme => theme.name === currentTheme) || QUICK_THEMES[0];
  };

  const currentThemeData = getCurrentThemeData();
  const CurrentIcon = currentThemeData.icon;

  return (
    <div className={`relative ${className}`}>
      {/* Theme Toggle Button */}
      <div className="dropdown dropdown-end">
        <div 
          tabIndex={0} 
          role="button" 
          className="btn btn-ghost btn-circle btn-sm hover:bg-base-200/50 transition-all duration-200"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CurrentIcon className="w-4 h-4" />
        </div>
        
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div 
              className="dropdown-content z-50 mt-2 p-3 shadow-xl bg-base-100 rounded-2xl border border-base-300/50 w-64"
            >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-base-300/30">
                <Palette className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Quick Themes</span>
              </div>

              {/* System Theme Option */}
              <button
                onClick={handleSystemTheme}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-base-200/50 transition-all duration-200 text-left"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">System</div>
                  <div className="text-xs text-base-content/60">
                    Follow system ({systemTheme})
                  </div>
                </div>
              </button>

              {/* Quick Theme Options */}
              <div className="grid grid-cols-1 gap-1">
                {QUICK_THEMES.map((theme) => {
                  const Icon = theme.icon;
                  const isActive = currentTheme === theme.name;
                  
                  return (
                    <button
                      key={theme.name}
                      onClick={() => handleThemeChange(theme.name)}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 text-left ${
                        isActive 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-base-200/50'
                      }`}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ 
                          backgroundColor: theme.colors.base,
                          color: theme.colors.content,
                          border: `1px solid ${theme.colors.primary}20`
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{theme.displayName}</div>
                        <div className="flex gap-1 mt-1">
                          <div 
                            className="w-3 h-3 rounded-full border border-base-300/30"
                            style={{ backgroundColor: theme.colors.primary }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full border border-base-300/30"
                            style={{ backgroundColor: theme.colors.base }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full border border-base-300/30"
                            style={{ backgroundColor: theme.colors.content }}
                          />
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-base-300/30">
                <div className="text-xs text-base-content/50 text-center">
                  More themes available after sign in
                </div>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

export default QuickThemeToggle;