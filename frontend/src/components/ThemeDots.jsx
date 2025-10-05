import { useState } from "react";
import { Sun, Moon, Zap, Sparkles, Gamepad2 } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

// Top 5 themes with conceptual icons
const THEME_ICONS = [
    {
        name: "light",
        displayName: "Light",
        icon: Sun,
        color: "#570df8"
    },
    {
        name: "dark",
        displayName: "Dark",
        icon: Moon,
        color: "#661ae6"
    },
    {
        name: "synthwave",
        displayName: "Synthwave",
        icon: Zap,
        color: "#e779c1"
    },
    {
        name: "dracula",
        displayName: "Dracula",
        icon: Sparkles,
        color: "#ff79c6"
    },
    {
        name: "cyberpunk",
        displayName: "Cyberpunk",
        icon: Gamepad2,
        color: "#ff7598"
    }
];

function ThemeIcons({ className = "" }) {
    const { currentTheme, setTheme } = useThemeStore();
    const [hoveredTheme, setHoveredTheme] = useState(null);

    const handleThemeChange = (themeName) => {
        setTheme(themeName);
    };

    return (
        <div className={`flex items-center justify-center gap-3 ${className}`}>
            <span className="text-xs text-base-content/50 mr-2">Themes:</span>
            <div className="flex items-center gap-2">
                {THEME_ICONS.map((theme) => {
                    const isActive = currentTheme === theme.name;
                    const isHovered = hoveredTheme === theme.name;
                    const Icon = theme.icon;

                    return (
                        <button
                            key={theme.name}
                            onClick={() => handleThemeChange(theme.name)}
                            onMouseEnter={() => setHoveredTheme(theme.name)}
                            onMouseLeave={() => setHoveredTheme(null)}
                            className={`relative group p-2 rounded-lg transition-all duration-300 ${
                                isActive 
                                    ? 'bg-base-200/50 scale-110 shadow-lg' 
                                    : 'hover:bg-base-200/30 hover:scale-105'
                            }`}
                            title={theme.displayName}
                        >
                            {/* Theme Icon */}
                            <Icon 
                                className={`w-5 h-5 transition-all duration-300 ${
                                    isActive ? 'drop-shadow-lg' : ''
                                }`}
                                style={{
                                    color: isActive ? theme.color : undefined,
                                    filter: isActive ? `drop-shadow(0 0 8px ${theme.color}40)` : undefined
                                }}
                            />

                            {/* Active indicator */}
                            {isActive && (
                                <div 
                                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-pulse"
                                    style={{ backgroundColor: theme.color }}
                                />
                            )}

                            {/* Hover tooltip */}
                            {isHovered && (
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-base-content text-base-100 text-xs rounded whitespace-nowrap z-10">
                                    {theme.displayName}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-base-content" />
                                </div>
                            )}

                            {/* Ripple effect on click */}
                            <div className="absolute inset-0 rounded-lg opacity-0 group-active:opacity-100 group-active:animate-ping bg-white/20" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default ThemeIcons;