import { useThemeStore } from "../store/useThemeStore";
import { useEffect, useState } from "react";

export default function ThemeDebug() {
  const { currentTheme } = useThemeStore();
  const [htmlTheme, setHtmlTheme] = useState("");

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setHtmlTheme(theme || "none");
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-base-200 p-4 rounded-lg shadow-lg border border-base-300 text-sm z-[9999]">
      <div className="font-bold mb-2">Theme Debug</div>
      <div>Store Theme: <span className="font-mono text-primary">{currentTheme}</span></div>
      <div>HTML Theme: <span className="font-mono text-secondary">{htmlTheme}</span></div>
      <div className="mt-2 flex gap-2">
        <div className="w-8 h-8 bg-primary rounded"></div>
        <div className="w-8 h-8 bg-secondary rounded"></div>
        <div className="w-8 h-8 bg-accent rounded"></div>
      </div>
    </div>
  );
}
