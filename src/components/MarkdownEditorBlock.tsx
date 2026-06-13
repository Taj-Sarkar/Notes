/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Hash, Code, Terminal, Quote, Link, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => { setInternalContent(block.content); }, [block.content]);

  const autoResize = () => {
    const t = textareaRef.current;
    if (t) { t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`; }
  };

  useEffect(() => {
    if (isActive && !isForcedPreview) {
      autoResize();
      setTimeout(() => {
        if (textareaRef.current && document.activeElement !== textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
    }
  }, [isActive, isForcedPreview]);

  useEffect(() => {
    window.addEventListener('resize', autoResize);
    return () => window.removeEventListener('resize', autoResize);
  }, []);

  const insertFormat = (fmt: 'bold' | 'italic' | 'h1' | 'h2' | 'code' | 'codeblock' | 'quote' | 'link') => {
    const t = textareaRef.current;
    if (!t) return;
    const start = t.selectionStart, end = t.selectionEnd;
    const sel = internalContent.substring(start, end);
    const map: Record<string, [string, number]> = {
      bold:      [`**${sel || 'text'}**`, sel ? 0 : -2],
      italic:    [`*${sel || 'text'}*`,   sel ? 0 : -1],
      h1:        [`\n# ${sel || 'Heading'}`, 0],
      h2:        [`\n## ${sel || 'Heading'}`, 0],
      code:      [`\`${sel || 'code'}\``, sel ? 0 : -1],
      codeblock: [`\n\`\`\`js\n${sel || '// code'}\n\`\`\`\n`, 0],
      quote:     [`\n> ${sel || 'quote'}`, 0],
      link:      [`[${sel || 'label'}](https://)`, sel ? 0 : -12],
    };
    const [replacement, offset] = map[fmt];
    const newContent = internalContent.substring(0, start) + replacement + internalContent.substring(end);
    setInternalContent(newContent);
    onUpdate(newContent);
    setTimeout(() => {
      t.focus();
      const pos = start + replacement.length + offset;
      t.setSelectionRange(pos, pos);
      autoResize();
    }, 50);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInternalContent(e.target.value);
    onUpdate(e.target.value);
    autoResize();
  };

  const showPreview = !isActive || isForcedPreview;

  // ── FORMAT TOOLBAR ────────────────────────────────────────────
  const FormatBar = () => (
    <div className="flex items-center justify-between mb-2 select-none w-full">
      <div className="flex items-center gap-0.5">
        {([
          ['bold',      <Bold size={11} />,     'Bold'],
          ['italic',    <Italic size={11} />,   'Italic'],
          ['h1',        <Hash size={11} />,     'H1'],
          ['h2',        <span className="text-[9px] font-bold leading-none">H2</span>, 'H2'],
          ['code',      <Code size={11} />,     'Inline code'],
          ['codeblock', <Terminal size={11} />, 'Code block'],
          ['quote',     <Quote size={11} />,    'Blockquote'],
          ['link',      <Link size={11} />,     'Link'],
        ] as [string, React.ReactNode, string][]).map(([key, icon, label]) => (
          <button
            key={key}
            type="button"
            title={label}
            onClick={() => insertFormat(key as Parameters<typeof insertFormat>[0])}
            className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {icon}
          </button>
        ))}
        <div className="w-px h-3 bg-white/10 mx-1" />
        <span className="text-[8px] text-zinc-700 tracking-widest">MD</span>
      </div>

      {/* Mobile-only block actions inside format bar */}
      <div className="flex items-center gap-1 md:hidden">
        {onMoveUp && index > 0 && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onMoveUp(); }}
            title="Move up"
            className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer transition-colors"
          >
            <ArrowUp size={11} />
          </button>
        )}
        {onMoveDown && index < totalBlocks - 1 && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onMoveDown(); }}
            title="Move down"
            className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer transition-colors"
          >
            <ArrowDown size={11} />
          </button>
        )}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }}
          title="Delete block"
          className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-red-500 cursor-pointer transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );

  // ── TEXT BLOCK ────────────────────────────────────────────────
  if (block.type === 'text') {
    return (
      <div
        className="group relative py-1 transition-all duration-150"
        id={`editor-block-${index}`}
        onClick={onFocus}
      >
        {/* Left gutter */}
        <div className="hidden md:flex absolute -left-10 top-1 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none">
          {showDeleteConfirm ? (
            <div className="flex flex-col gap-1">
              <button onClick={e => { e.stopPropagation(); onDelete(); }} className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-400 transition-colors cursor-pointer" title="Yes, delete">
                <Trash2 size={11} />
              </button>
              <button onClick={e => { e.stopPropagation(); setShowDeleteConfirm(false); }} className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white transition-colors cursor-pointer text-[9px] font-bold" title="Cancel">
                ✕
              </button>
            </div>
          ) : (
            <>
              <button onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }} title="Delete" className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-red-500 transition-colors cursor-pointer">
                <Trash2 size={11} />
              </button>
              {onMoveUp && index > 0 && (
                <button onClick={e => { e.stopPropagation(); onMoveUp(); }} title="Move up" className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-white transition-colors cursor-pointer">
                  <ArrowUp size={11} />
                </button>
              )}
              {onMoveDown && index < totalBlocks - 1 && (
                <button onClick={e => { e.stopPropagation(); onMoveDown(); }} title="Move down" className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-white transition-colors cursor-pointer">
                  <ArrowDown size={11} />
                </button>
              )}
            </>
          )}
        </div>

        <div className="px-2">
          {/* Inline delete confirmation message */}
          {showDeleteConfirm && (
            <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-1.5 select-none">
              <span>delete block?</span>
              <button onClick={onDelete} className="text-red-500 hover:text-red-400 font-bold cursor-pointer transition-colors">yes</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="hover:text-white cursor-pointer transition-colors">no</button>
            </div>
          )}

          {isActive && !isForcedPreview && <FormatBar />}

          {showPreview ? (
            <div
              className="min-h-[28px] cursor-text"
              onClick={() => { onFocus(); setIsForcedPreview(false); }}
            >
              {block.content
                ? <MarkdownRenderer content={block.content} />
                : <span className="text-zinc-700 text-sm italic">Empty block — click to edit</span>
              }
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={internalContent}
              onChange={handleChange}
              placeholder="Write in Markdown… (## heading, **bold**, `code`)"
              className="w-full bg-transparent border-none text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus:ring-0 resize-none leading-relaxed font-mono"
            />
          )}
        </div>
      </div>
    );
  }

  // ── TASK BLOCK ────────────────────────────────────────────────
  return (
    <div
      className="group relative flex flex-col py-1 transition-all duration-150"
      id={`editor-block-${index}`}
    >
      {/* Inline delete confirmation */}
      {showDeleteConfirm && (
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-1 px-2 select-none">
          <span>delete block?</span>
          <button onClick={onDelete} className="text-red-500 hover:text-red-400 font-bold cursor-pointer transition-colors">yes</button>
          <button onClick={() => setShowDeleteConfirm(false)} className="hover:text-white cursor-pointer transition-colors">no</button>
        </div>
      )}

      <div className="relative flex items-start gap-3 px-2">
        {/* Left gutter */}
        <div className="hidden md:flex absolute -left-10 top-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none">
          {showDeleteConfirm ? (
            <div className="flex flex-col gap-1">
              <button onClick={() => onDelete()} className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-400 transition-colors cursor-pointer" title="Yes, delete">
                <Trash2 size={11} />
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white transition-colors cursor-pointer text-[9px] font-bold" title="Cancel">
                ✕
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setShowDeleteConfirm(true)} title="Delete" className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-red-500 transition-colors cursor-pointer">
                <Trash2 size={11} />
              </button>
              {onMoveUp && index > 0 && (
                <button onClick={onMoveUp} title="Move up" className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-white transition-colors cursor-pointer">
                  <ArrowUp size={11} />
                </button>
              )}
              {onMoveDown && index < totalBlocks - 1 && (
                <button onClick={onMoveDown} title="Move down" className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-white transition-colors cursor-pointer">
                  <ArrowDown size={11} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Checkbox */}
        <button
          onClick={() => onUpdate(block.content, !block.checked)}
          className={`mt-0.5 w-4 h-4 shrink-0 border transition-all duration-150 flex items-center justify-center cursor-pointer ${
            block.checked ? 'bg-white border-white' : 'bg-transparent border-zinc-600 hover:border-white'
          }`}
        >
          {block.checked && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.5 6L8 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Task text */}
        <input
          type="text"
          value={block.content}
          onChange={e => onUpdate(e.target.value, block.checked)}
          onFocus={onFocus}
          placeholder="Task item…"
          className={`flex-1 bg-transparent border-none text-sm focus:outline-none focus:ring-0 font-mono placeholder-zinc-700 ${
            block.checked ? 'line-through text-zinc-600' : 'text-zinc-300'
          }`}
        />

        {/* Mobile-only task block actions */}
        {isActive && (
          <div className="flex items-center gap-1 shrink-0 md:hidden ml-2">
            {onMoveUp && index > 0 && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onMoveUp(); }}
                title="Move up"
                className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer transition-colors"
              >
                <ArrowUp size={11} />
              </button>
            )}
            {onMoveDown && index < totalBlocks - 1 && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onMoveDown(); }}
                title="Move down"
                className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer transition-colors"
              >
                <ArrowDown size={11} />
              </button>
            )}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              title="Delete block"
              className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-red-500 cursor-pointer transition-colors"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
