import { Palette } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

function ThemeButton() {
  const { openModal } = useThemeStore();

  return (
    <button
      className="text-base-content/60 hover:text-base-content transition-colors"
      onClick={openModal}
      aria-label="Change theme"
      title="Change theme"
    >
      <Palette className="size-5" />
    </button>
  );
}

export default ThemeButton;