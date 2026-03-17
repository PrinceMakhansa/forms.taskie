import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ToolbarPosition {
  top: number;
  left: number;
}

interface LinkDialogState {
  visible: boolean;
  url: string;
  top: number;
  left: number;
}

interface RichTextInputProps {
  value: string; // stored as HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  singleLine?: boolean;
  style?: React.CSSProperties;
}

export default function RichTextInput({
  value,
  onChange,
  placeholder = '',
  className = '',
  singleLine = false,
  style,
}: RichTextInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<{
    visible: boolean;
    position: ToolbarPosition;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    link: boolean;
  }>({
    visible: false,
    position: { top: 0, left: 0 },
    bold: false,
    italic: false,
    underline: false,
    link: false,
  });
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>({
    visible: false,
    url: '',
    top: 0,
    left: 0,
  });
  const linkInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const isInternalChange = useRef(false);

  // Sync value -> DOM only when changed externally
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const getSelectedAnchor = useCallback((): HTMLAnchorElement | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'A') {
        return node as HTMLAnchorElement;
      }
      node = node.parentNode;
    }
    return null;
  }, []);

  const getToolbarState = useCallback(() => ({
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    link: !!getSelectedAnchor(),
  }), [getSelectedAnchor]);

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setToolbar(prev => ({ ...prev, visible: false }));
      return;
    }
    const range = sel.getRangeAt(0);
    const editorEl = editorRef.current;
    if (!editorEl || !editorEl.contains(range.commonAncestorContainer)) {
      setToolbar(prev => ({ ...prev, visible: false }));
      return;
    }

    const rect = range.getBoundingClientRect();
    const editorRect = editorEl.getBoundingClientRect();
    const toolbarWidth = 180;
    let left = rect.left - editorRect.left + rect.width / 2 - toolbarWidth / 2;
    left = Math.max(0, Math.min(left, editorRect.width - toolbarWidth));
    const top = rect.top - editorRect.top - 50;

    setToolbar({
      visible: true,
      position: { top, left },
      ...getToolbarState(),
    });
  }, [getToolbarState]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const handleContentChange = useCallback(() => {
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML || '');
  }, [onChange]);

  const execFormat = useCallback((command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    handleContentChange();
    setTimeout(() => {
      setToolbar(prev => ({ ...prev, ...getToolbarState() }));
    }, 0);
  }, [handleContentChange, getToolbarState]);

  const openLinkDialog = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
    const existingAnchor = getSelectedAnchor();
    setLinkDialog({
      visible: true,
      url: existingAnchor?.href || 'https://',
      top: toolbar.position.top,
      left: toolbar.position.left,
    });
    setTimeout(() => linkInputRef.current?.focus(), 50);
  }, [getSelectedAnchor, toolbar.position]);

  const applyLink = useCallback(() => {
    const url = linkDialog.url.trim();
    editorRef.current?.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }
    if (url && url !== 'https://') {
      document.execCommand('createLink', false, url);
      const anchor = getSelectedAnchor();
      if (anchor) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }
    } else {
      document.execCommand('unlink', false);
    }
    handleContentChange();
    setLinkDialog(prev => ({ ...prev, visible: false }));
    setToolbar(prev => ({ ...prev, visible: false }));
  }, [linkDialog.url, getSelectedAnchor, handleContentChange]);

  const removeLink = useCallback(() => {
    editorRef.current?.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }
    document.execCommand('unlink', false);
    handleContentChange();
    setLinkDialog(prev => ({ ...prev, visible: false }));
    setToolbar(prev => ({ ...prev, visible: false }));
  }, [handleContentChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (singleLine && e.key === 'Enter') {
      e.preventDefault();
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'b') { e.preventDefault(); execFormat('bold'); }
      if (e.key === 'i') { e.preventDefault(); execFormat('italic'); }
      if (e.key === 'u') { e.preventDefault(); execFormat('underline'); }
    }
  };

  const isEmpty = !value || value === '<br>' || value === '';

  return (
    <div className="relative">
      {isEmpty && (
        <span
          className="pointer-events-none absolute left-0 top-0 text-gray-400 select-none"
          style={style}
          aria-hidden
        >
          {placeholder}
        </span>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        onMouseUp={handleSelectionChange}
        className={`focus:outline-none ${className}`}
        style={{
          ...style,
          whiteSpace: singleLine ? 'nowrap' : 'pre-wrap',
          overflowX: singleLine ? 'hidden' : undefined,
        }}
      />

      {/* Floating Format Toolbar */}
      {toolbar.visible && !linkDialog.visible && (
        <div
          className="absolute z-50 flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white shadow-lg px-1.5 py-1"
          style={{ top: toolbar.position.top, left: toolbar.position.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <ToolbarButton active={toolbar.bold} onClick={() => execFormat('bold')} title="Bold (Ctrl+B)">
            <BoldIcon />
          </ToolbarButton>
          <ToolbarButton active={toolbar.italic} onClick={() => execFormat('italic')} title="Italic (Ctrl+I)">
            <ItalicIcon />
          </ToolbarButton>
          <ToolbarButton active={toolbar.underline} onClick={() => execFormat('underline')} title="Underline (Ctrl+U)">
            <UnderlineIcon />
          </ToolbarButton>
          <div className="mx-1 h-5 w-px bg-gray-200" />
          <ToolbarButton active={toolbar.link} onClick={openLinkDialog} title="Insert link">
            <LinkIcon />
          </ToolbarButton>
        </div>
      )}

      {/* Link Dialog */}
      {linkDialog.visible && (
        <div
          className="absolute z-50 rounded-lg border border-gray-200 bg-white shadow-lg p-3 w-72"
          style={{ top: linkDialog.top, left: linkDialog.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <p className="mb-2 text-xs font-medium text-gray-600">Insert link</p>
          <input
            ref={linkInputRef}
            type="url"
            value={linkDialog.url}
            onChange={(e) => setLinkDialog(prev => ({ ...prev, url: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
              if (e.key === 'Escape') setLinkDialog(prev => ({ ...prev, visible: false }));
            }}
            placeholder="https://example.com"
            className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={applyLink}
              className="flex-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Apply
            </button>
            {getSelectedAnchor() && (
              <button
                onClick={removeLink}
                className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Remove
              </button>
            )}
            <button
              onClick={() => setLinkDialog(prev => ({ ...prev, visible: false }))}
              className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(e); }}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BoldIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  );
}