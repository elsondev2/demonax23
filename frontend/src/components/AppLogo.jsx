import { useThemeStore } from "../store/useThemeStore";
import { isDarkTheme } from "../constants/themes";

const AppLogo = ({ className = "w-48 h-48", alt = "App Logo" }) => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  
  // Use dark logo for light themes, light logo for dark themes
  const logoSrc = isDarkTheme(currentTheme) 
    ? "/assets/lightlogo.png" 
    : "/assets/darklogo.png";

  return (
    <div className="flex justify-center">
      <img
        key={currentTheme} // Force re-render when theme changes
        src={logoSrc}
        alt={alt}
        className={`${className} object-contain transition-opacity duration-300`}
      />
    </div>
  );
};

export default AppLogo;