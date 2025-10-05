import { useThemeStore } from "../store/useThemeStore";

function ThemeLoadingBar() {
  const { isChangingTheme } = useThemeStore();

  if (!isChangingTheme) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-base-300">
      <div 
        className="h-full bg-primary transition-all duration-75 ease-out"
        style={{
          width: '100%',
          animation: 'loadingBar 0.75s ease-out forwards'
        }}
      />
      <style jsx>{`
        @keyframes loadingBar {
          0% {
            width: 0%;
          }
          25% {
            width: 40%;
          }
          50% {
            width: 70%;
          }
          75% {
            width: 90%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default ThemeLoadingBar;