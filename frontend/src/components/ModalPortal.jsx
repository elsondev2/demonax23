import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useThemeStore } from "../store/useThemeStore";

export default function ModalPortal({ children, zIndex = 100 }) {
  const { currentTheme } = useThemeStore();
  const elRef = useRef(null);
  if (!elRef.current && typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.zIndex = String(zIndex);
    el.style.pointerEvents = 'none'; // Allow clicks to pass through the container
    // Ensure theme tokens apply even if consumers rely on container scoping
    el.setAttribute('data-theme', currentTheme || 'dark');
    elRef.current = el;
  }

  // Keep portal container theme in sync with app theme
  useEffect(() => {
    const el = elRef.current;
    if (el) el.setAttribute('data-theme', currentTheme || 'dark');
  }, [currentTheme]);

  useEffect(() => {
    const el = elRef.current;
    if (!el || typeof document === 'undefined') return;
    document.body.appendChild(el);
    return () => {
      try { document.body.removeChild(el); } catch { /* empty */ }
    };
  }, []);

  if (!elRef.current) return null;
  return createPortal(children, elRef.current);
}
