import { useEffect, useCallback, Component } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getRoot, 
  $getSelection, 
  $isRangeSelection, 
  FORMAT_TEXT_COMMAND, 
  COMMAND_PRIORITY_LOW, 
  KEY_ENTER_COMMAND,
  TextNode,
  $createParagraphNode,
  $createTextNode
} from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { mergeRegister } from '@lexical/utils';

/**
 * Error Boundary component for Lexical editor
 */
class LexicalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lexical editor error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-error text-sm p-2">Editor error occurred. Please refresh.</div>;
    }
    return this.props.children;
  }
}

/**
 * Plugin to handle formatting commands from toolbar
 */
function FormattingPlugin({ onFormatChange }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const formats = {
              bold: selection.hasFormat('bold'),
              italic: selection.hasFormat('italic'),
              underline: selection.hasFormat('underline'),
              strikethrough: selection.hasFormat('strikethrough'),
            };
            onFormatChange?.(formats);
          }
        });
      })
    );
  }, [editor, onFormatChange]);

  return null;
}

/**
 * Plugin to handle Enter key (send message)
 */
function EnterKeyPlugin({ onEnter, disabled }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (disabled) return false;
        
        // Shift+Enter = new line (default behavior)
        if (event.shiftKey) {
          return false;
        }
        
        // Enter = send message
        event.preventDefault();
        onEnter?.();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onEnter, disabled]);

  return null;
}

/**
 * Plugin to expose editor commands
 */
function CommandsPlugin({ commandsRef }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (commandsRef) {
      commandsRef.current = {
        applyFormat: (format) => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
        },
        clear: () => {
          editor.update(() => {
            const root = $getRoot();
            root.clear();
          });
        },
        focus: () => {
          editor.focus();
        },
        getPlainText: () => {
          let text = '';
          editor.getEditorState().read(() => {
            text = $getRoot().getTextContent();
          });
          return text;
        },
        getHtml: () => {
          let html = '';
          editor.getEditorState().read(() => {
            html = $generateHtmlFromNodes(editor);
          });
          return html;
        },
        setText: (text) => {
          editor.update(() => {
            const root = $getRoot();
            root.clear();
            const paragraph = $createParagraphNode();
            const textNode = $createTextNode(text);
            paragraph.append(textNode);
            root.append(paragraph);
          });
        },
      };
    }
  }, [editor, commandsRef]);

  return null;
}

/**
 * WYSIWYG Message Input Component using Lexical
 */
const WYSIWYGMessageInput = ({
  onChange,
  onEnter,
  onFormatChange,
  onFocus,
  onBlur,
  placeholder = 'Type a message...',
  disabled = false,
  maxLength = 2000,
  commandsRef,
  onPaste,
  onKeyDown,
  className = '',
}) => {
  const initialConfig = {
    namespace: 'MessageEditor',
    nodes: [TextNode],
    theme: {
      paragraph: 'mb-0 leading-tight',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        code: 'font-mono bg-base-200 px-1 rounded',
      },
    },
    onError: (error) => {
      console.error('Lexical error:', error);
    },
    editable: !disabled,
  };

  const handleChange = useCallback((editorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      
      // Enforce max length
      if (text.length > maxLength) {
        return;
      }
      
      // Only call onChange if text actually changed
      if (onChange) {
        onChange(text);
      }
    });
  }, [onChange, maxLength]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`relative ${className}`}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="textarea textarea-bordered w-full pr-12 resize-none leading-tight overflow-y-auto focus:outline-none focus:ring-2 focus:ring-primary"
              style={{
                paddingTop: '0.625rem',
                paddingBottom: '0.625rem',
                paddingRight: '3rem',
                minHeight: '2.5rem',
                maxHeight: '4.5rem',
                lineHeight: '1.5rem',
              }}
              onPaste={onPaste}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          }
          placeholder={
            <div 
              className="absolute top-2.5 left-3 text-base-content/50 pointer-events-none select-none overflow-hidden whitespace-nowrap text-ellipsis"
              style={{ maxWidth: 'calc(100% - 4rem)' }}
            >
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        
        <OnChangePlugin onChange={handleChange} />
        <HistoryPlugin />
        <FormattingPlugin onFormatChange={onFormatChange} />
        <EnterKeyPlugin onEnter={onEnter} disabled={disabled} />
        <CommandsPlugin commandsRef={commandsRef} />
      </div>
    </LexicalComposer>
  );
};

export default WYSIWYGMessageInput;
