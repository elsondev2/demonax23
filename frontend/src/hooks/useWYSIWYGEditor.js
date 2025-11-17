import { useRef, useCallback, useState } from 'react';

/**
 * Hook to manage WYSIWYG editor state and commands
 * Provides a bridge between Lexical editor and MessageInput component
 */
export const useWYSIWYGEditor = () => {
  const commandsRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });

  // Apply formatting
  const applyFormat = useCallback((format) => {
    if (commandsRef.current) {
      commandsRef.current.applyFormat(format);
    }
  }, []);

  // Clear editor content
  const clearEditor = useCallback(() => {
    if (commandsRef.current) {
      commandsRef.current.clear();
    }
  }, []);

  // Focus editor
  const focusEditor = useCallback(() => {
    if (commandsRef.current) {
      commandsRef.current.focus();
    }
  }, []);

  // Get plain text content
  const getPlainText = useCallback(() => {
    if (commandsRef.current) {
      return commandsRef.current.getPlainText();
    }
    return '';
  }, []);

  // Get HTML content
  const getHtml = useCallback(() => {
    if (commandsRef.current) {
      return commandsRef.current.getHtml();
    }
    return '';
  }, []);

  // Set text content
  const setText = useCallback((text) => {
    if (commandsRef.current) {
      commandsRef.current.setText(text);
    }
  }, []);

  // Handle format changes from editor
  const handleFormatChange = useCallback((formats) => {
    setActiveFormats(formats);
  }, []);

  return {
    commandsRef,
    activeFormats,
    applyFormat,
    clearEditor,
    focusEditor,
    getPlainText,
    getHtml,
    setText,
    handleFormatChange,
  };
};
