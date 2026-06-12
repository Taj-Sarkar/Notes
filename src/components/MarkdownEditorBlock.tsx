/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Hash, Code, Terminal, Quote, Link, Trash2, Eye, Edit3, ArrowUp, ArrowDown } from 'lucide-react';
import { Block } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownEditorBlockProps {
  block: Block;
  index: number;
  totalBlocks: number;
  isActive: boolean;
  onUpdate: (content: string, checked?: boolean) => void;
  onDelete: () => void;
  onFocus: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const MarkdownEditorBlock: React.FC<MarkdownEditorBlockProps> = ({
  block,
  index,
  totalBlocks,
  isActive,
  onUpdate,
  onDelete,
  onFocus,
  onMoveUp,
  onMoveDown,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [internalContent, setInternalContent] = useState(block.content);
  const [isForcedPreview, setIsForcedPreview] = useState(false);

  // Sync internal content with external changes (e.g. undo/redo)
  useEffect(() => {
    setInternalContent(block.content);
  }, [block.content]);

  // Handle textarea height auto-resizing
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (isActive && !isForcedPreview) {
      autoResize();
      // Auto focus on creation or activation
      setTimeout(() => {
        if (textareaRef.current && document.activeElement !== textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
    }
  }, [isActive, isForcedPreview]);

  // Adjust height when window resizes
  useEffect(() => {
    window.addEventListener('resize', autoResize);
    return () => window.removeEventListener('resize', autoResize);
  }, []);

  // Format insertion logic
  const insertFormat = (formatType: 'bold' | 'italic' | 'h1' | 'h2' | 'code' | 'codeblock' | 'quote' | 'link') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = internalContent;
    const selectedText = text.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (formatType) {
      case 'bold':
        replacement = `**${selectedText || 'text'}**`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case 'italic':
        replacement = `*${selectedText || 'text'}*`;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case 'h1':
        replacement = `\n# ${selectedText || 'Header 1'}`;
        break;
      case 'h2':
        replacement = `\n## ${selectedText || 'Header 2'}`;
        break;
      case 'code':
        replacement = `\`${selectedText || 'code'}\``;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case 'codeblock':
        replacement = `\n\`\`\`javascript\n${selectedText || '// code here'}\n\`\`\`\n`;
        break;
      case 'quote':
        replacement = `\n> ${selectedText || 'quote'}`;
        break;
      case 'link':
        replacement = `[${selectedText || 'title'}](https://)`;
        cursorOffset = selectedText ? 0 : -12;
        break;
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setInternalContent(newContent);
    onUpdate(newContent);

    // Re-focus and restore cursor selection position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length + cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      autoResize();
    }, 50);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInternalContent(e.target.value);
    onUpdate(e.target.value);
    autoResize();
  };

  const handleTaskTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(e.target.value, block.checked);
  };

  const handleToggleTask = () => {
    onUpdate(block.content, !block.checked);
  };

  const showMarkdownPreview = !isActive || isForcedPreview;

  return (
    <div className="group flex gap-3.5 mb-2.5 items-start relative select-none" id={`editor-block-${index}`}>
      {/* Side Action Panel for Block Navigation and Deletion */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center gap-1.5 pt-2 select-none z-10 w-6">
        <button
          onClick={onDelete}
          className="text-zinc-600 hover:text-red-500 hover:bg-zinc-900/50 p-1 transition-all cursor-pointer"
          title="Delete Block"
        >
          <Trash2 size={13} />
        </button>
        {onMoveUp && index > 0 && (
          <button
            onClick={onMoveUp}
            className="text-zinc-600 hover:text-white hover:bg-zinc-900/50 p-1 transition-all cursor-pointer"
            title="Move Up"
          >
            <ArrowUp size={12} />
          </button>
        )}
        {onMoveDown && index < totalBlocks - 1 && (
          <button
            onClick={onMoveDown}
            className="text-zinc-600 hover:text-white hover:bg-zinc-900/50 p-1 transition-all cursor-pointer"
            title="Move Down"
          >
            <ArrowDown size={12} />
          </button>
        )}
        {block.type === 'text' && (
          <button
            onClick={() => setIsForcedPreview(!isForcedPreview)}
            className="text-zinc-600 hover:text-white hover:bg-zinc-900/50 p-1 transition-all cursor-pointer"
            title={isForcedPreview ? 'Edit Block' : 'Preview Block'}
          >
            {isForcedPreview ? <Edit3 size={11} /> : <Eye size={11} />}
          </button>
        )}
      </div>

      {block.type === 'text' ? (
        <div className="flex-1 min-w-0" onClick={onFocus}>
          {/* Format quick bar above active/focused text block keys */}
          {isActive && !isForcedPreview && (
            <div className="flex flex-wrap items-center gap-1 mb-1.5 border border-zinc-800 bg-[#090909]/95 p-1 select-none z-10 self-start">
              <button
                type="button"
                onClick={() => insertFormat('bold')}
                className="hover:text-white hover:bg-zinc-900 text-zinc-500 p-1 text-[10px] uppercase font-mono font-bold flex gap-0.5 items-center transition-all cursor-pointer border border-transparent hover:border-zinc-800"
                title="Bold"
              >
                <Bold size={11} />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('italic')}
                className="hover:text-white hover:bg-zinc-900 text-zinc-500 p-1 text-[10px] uppercase font-mono italic flex gap-0.5 items-center transition-all cursor-pointer border border-transparent hover:border-zinc-800"
                title="Italic"
              >
                <Italic size={11} />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('h1')}
                className="hover:text-white hover:bg-zinc-900 text-zinc-500 p-1 text-[10px] uppercase font-mono font-bold flex gap-0.5 items-center transition-all cursor-pointer border border-transparent hover:border-zinc-800"
                title="Header 1"
              >
                <Hash size={11} />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('h2')}
                className="hover:text-white hover:bg-zinc-900 text-zinc-500 p-1 text-[10px] uppercase font-mono font-bold flex gap-0.5 items-center transition-all cursor-pointer border border-transparent hover:border-zinc-800"
                title="Header 2"
              >
                <span className="text-[9px] font-bold">H2</span>
              </button>
              <button
                type="button"
                onClick={() => insertFormat('code')}
                className="hover:text-white hover:bg-zinc-900 text-zinc-500 p-1 text-[10px] uppercase font-mono flex gap-0.5 items-center transition-all cursor-pointer border border-transparent hover:border-zinc-800"
                title="Inline Code"
              >
                <Code size={11} />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('codeblock')}
                className="hover:text-white hover:bg-zinc-900 text-zinc-500 p-1 text-[10px] uppercase font-mono flex gap-0.5 items-center transition-all cursor-pointer border border-transparent hover:border-zinc-800"
                title="Code Block"
              >
                <Terminal size={11} />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('quote')}
                className="hover:text-white hover:bg-zinc-900 text-zinc-500 p-1 text-[10px] uppercase font-mono flex gap-0.5 items-center transition-all cursor-pointer border border-transparent hover:border-zinc-800"
                title="Blockquote"
              >
                <Quote size={11} />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('link')}
                className="hover:text-white hover:bg-zinc-900 text-zinc-500 p-1 text-[10px] uppercase font-mono flex gap-0.5 items-center transition-all cursor-pointer border border-transparent hover:border-zinc-800"
                title="Link"
              >
                <Link size={11} />
              </button>

              <div className="w-[1px] h-3.5 bg-zinc-800 mx-1"></div>
              <span className="text-[8px] text-zinc-600 font-mono tracking-wider font-bold">MARKDOWN</span>
            </div>
          )}

          {/* Toggle between Text Editor and High Fidelity Markdown Viewer */}
          {showMarkdownPreview ? (
            <div 
              className="py-1 min-h-[36px] w-full cursor-text hover:bg-zinc-900/10 px-2 transition-all duration-150 hover:border-l border-zinc-700/40"
              onClick={() => setIsForcedPreview(false)}
              title="Click to edit Markdown"
            >
              <MarkdownRenderer content={block.content} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={internalContent}
              onChange={handleChange}
              placeholder="Type here in Markdown... (e.g. ## Header, **bold**, `code`)"
              className="w-full bg-transparent border-0 border-l border-zinc-800/80 pl-3.5 pr-2 py-1 text-sm text-white focus:text-white focus:border-white focus:ring-0 resize-none outline-none font-mono leading-relaxed placeholder-zinc-700"
            />
          )}
        </div>
      ) : (
        <div className="flex-grow flex gap-2.5 items-start bg-transparent py-1 px-2 border border-transparent focus-within:border-zinc-800 hover:bg-zinc-900/10 focus-within:bg-[#121212] transition-all duration-150 group/task w-full">
          <div
            onClick={handleToggleTask}
            className={`w-4 h-4 border border-white flex items-center justify-center cursor-pointer mt-0.5 transition-all duration-150 ${
              block.checked ? 'bg-white text-black' : 'bg-transparent text-transparent hover:border-zinc-400'
            }`}
          >
            {block.checked && <span className="font-bold text-[10px] md:text-xs">×</span>}
          </div>
          <input
            type="text"
            value={block.content}
            onChange={handleTaskTextChange}
            onFocus={onFocus}
            placeholder="TASK WORKITEM..."
            className={`flex-grow bg-transparent border-0 p-0 text-sm focus:ring-0 outline-none font-mono text-white placeholder-zinc-700 ${
              block.checked ? 'line-through text-zinc-500/80 decoration-zinc-500' : ''
            }`}
          />
        </div>
      )}
    </div>
  );
};
