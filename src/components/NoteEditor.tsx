/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, ChevronDown, Image as ImageIcon, Trash2, Plus,
  CornerUpLeft, CornerUpRight, FileText, Layers, X
} from 'lucide-react';
import { Note, Block, BlockType } from '../types';
import { MarkdownEditorBlock } from './MarkdownEditorBlock';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ConfirmDialog } from './ConfirmDialog';
import { InputDialog } from './InputDialog';

interface NoteEditorProps {
  note: Note | null;
  categories: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete: (id: number) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  categories,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [bg, setBg] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBgDialog, setShowBgDialog]           = useState(false);

  const [titleScrolled, setTitleScrolled] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const historyStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const lastPushedState = useRef<string>('');

  useEffect(() => {
    if (isOpen) {
      historyStack.current = [];
      redoStack.current = [];
      setViewMode('preview');

      if (note) {
        setTitle(note.title);
        setCategory(note.category);
        setBg(note.bg);
        const blocksWithIds = (note.blocks ?? []).map(b => ({
          ...b,
          id: b.id || Math.random().toString(36).substring(2, 9),
        }));
        setBlocks(blocksWithIds);
        lastPushedState.current = JSON.stringify({ title: note.title, blocks: blocksWithIds });
      } else {
        setTitle('');
        setCategory(categories[0] || 'GENERAL');
        setBg('');
        const initialBlocks = [{ id: Math.random().toString(36).substring(2, 9), type: 'text' as BlockType, content: '' }];
        setBlocks(initialBlocks);
        lastPushedState.current = JSON.stringify({ title: '', blocks: initialBlocks });
      }
    }
  }, [note, isOpen, categories]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show title in header when it scrolls out of view
  useEffect(() => {
    if (!isOpen) return;
    const el = titleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTitleScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (!isOpen) return;
      // Only intercept undo/redo when editor is open and focus is inside it
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handlersRef.current.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handlersRef.current.redo();
      }
    };
    document.addEventListener('keydown', handleGlobalKeys);
    return () => document.removeEventListener('keydown', handleGlobalKeys);
  }, [isOpen]);

  // Ref so the keydown handler always calls the latest undo/redo without stale closures
  const handlersRef = useRef({ undo: () => {}, redo: () => {} });

  const pushStateToHistory = (customTitle = title, customBlocks = blocks) => {
    const serialized = JSON.stringify({ title: customTitle, blocks: customBlocks });
    if (serialized !== lastPushedState.current) {
      historyStack.current.push(lastPushedState.current);
      lastPushedState.current = serialized;
      redoStack.current = [];
      if (historyStack.current.length > 50) historyStack.current.shift();
    }
  };

  const handleUndo = () => {
    if (!historyStack.current.length) return;
    redoStack.current.push(JSON.stringify({ title, blocks }));
    const prev = JSON.parse(historyStack.current.pop()!);
    setTitle(prev.title);
    setBlocks(prev.blocks);
    lastPushedState.current = JSON.stringify(prev);
  };

  const handleRedo = () => {
    if (!redoStack.current.length) return;
    historyStack.current.push(JSON.stringify({ title, blocks }));
    const next = JSON.parse(redoStack.current.pop()!);
    setTitle(next.title);
    setBlocks(next.blocks);
    lastPushedState.current = JSON.stringify(next);
  };

  // Keep the ref up to date on every render
  handlersRef.current = { undo: handleUndo, redo: handleRedo };

  const handleUpdateBlock = (id: string, content: string, checked?: boolean) => {
    const timerId = setTimeout(() => pushStateToHistory(title, blocks), 400);
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content, checked } : b));
    return () => clearTimeout(timerId);
  };

  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      pushStateToHistory();
      setBlocks([{ id: Math.random().toString(36).substring(2, 9), type: 'text', content: '' }]);
      return;
    }
    pushStateToHistory();
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleAddBlock = (type: BlockType) => {
    pushStateToHistory();
    const newBlock: Block = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      content: '',
      checked: type === 'task' ? false : undefined,
    };
    setBlocks(prev => [...prev, newBlock]);
    setActiveBlockId(newBlock.id);
    setTimeout(() => {
      const el = document.getElementById(`editor-block-${blocks.length}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const handleMoveBlockUp = (index: number) => {
    if (index === 0) return;
    pushStateToHistory();
    setBlocks(prev => {
      const c = [...prev]; [c[index], c[index - 1]] = [c[index - 1], c[index]]; return c;
    });
  };

  const handleMoveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    pushStateToHistory();
    setBlocks(prev => {
      const c = [...prev]; [c[index], c[index + 1]] = [c[index + 1], c[index]]; return c;
    });
  };

  const handleSaveAndClose = () => {
    const finalTitle = title.trim() || 'UNTITLED';
    const filledBlocks = blocks.filter(b => b.content.trim() !== '');
    onSave({
      id: note ? note.id : Date.now(),
      title: finalTitle,
      category,
      bg,
      dimmed: false,
      blocks: filledBlocks.length > 0 ? filledBlocks : [{ id: Math.random().toString(36).substring(2, 9), type: 'text', content: '' }],
    });
    onClose();
  };

  const promptBgImage = () => setShowBgDialog(true);

  const compileFullMarkdown = (): string => {
    // Only compile text blocks — task blocks are rendered separately
    return blocks
      .filter(b => b.type === 'text')
      .map(b => b.content)
      .join('\n\n');
  };

  if (!isOpen) return null;

  const canUndo = historyStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  return (
    <>
    <div className="fixed inset-0 w-full h-full z-[100] flex flex-col font-mono">

      {/* Background layer */}
      {bg && (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url('${bg}')` }}
        />
      )}
      <div className="absolute inset-0 bg-[#080808] pointer-events-none" />
      {bg && <div className="absolute inset-0 bg-[#080808]/95 pointer-events-none" />}

      {/* ── TOP NAV ─────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-white/[0.07] bg-[#0a0a0a]/90 backdrop-blur-sm shrink-0">

        {/* Left cluster */}
        <div className="flex items-center gap-5 min-w-0">
          {/* Back */}
          <button
            onClick={handleSaveAndClose}
            className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs tracking-widest transition-colors duration-150 cursor-pointer shrink-0"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">BACK</span>
          </button>

          <div className="w-px h-4 bg-white/10 shrink-0" />

          {/* Title slides in here when scrolled */}
          <span
            className={`text-sm font-bold text-white tracking-tight truncate transition-all duration-200 ${
              titleScrolled ? 'opacity-100 max-w-[260px]' : 'opacity-0 max-w-0 overflow-hidden'
            }`}
          >
            {title || 'Untitled'}
          </span>

          {/* Category picker — hides when title is showing to save space */}
          <div className={`relative transition-all duration-200 ${titleScrolled ? 'opacity-0 w-0 overflow-hidden pointer-events-none' : 'opacity-100'}`} ref={selectRef}>
            <button
              onClick={() => setIsCatDropdownOpen(v => !v)}
              className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white tracking-widest uppercase transition-colors cursor-pointer"
            >
              {category}
              <ChevronDown size={10} className="text-zinc-600" />
            </button>
            {isCatDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 min-w-[130px] bg-[#111] border border-white/10 shadow-2xl z-50">
                {categories.map(cat => (
                  <div
                    key={cat}
                    onClick={() => { setCategory(cat); setIsCatDropdownOpen(false); }}
                    className={`px-4 py-2 text-[11px] tracking-widest uppercase cursor-pointer transition-colors font-bold ${
                      cat === category ? 'text-white bg-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* View mode toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-widest transition-colors cursor-pointer ${
                viewMode === 'edit' ? 'text-white bg-white/10' : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              <FileText size={10} /> EDIT
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-widest transition-colors cursor-pointer ${
                viewMode === 'preview' ? 'text-white bg-white/10' : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              <Layers size={10} /> PREVIEW
            </button>
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 transition-colors cursor-pointer ${canUndo ? 'text-zinc-400 hover:text-white' : 'text-zinc-700 cursor-not-allowed'}`}
          >
            <CornerUpLeft size={13} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`p-1.5 transition-colors cursor-pointer ${canRedo ? 'text-zinc-400 hover:text-white' : 'text-zinc-700 cursor-not-allowed'}`}
          >
            <CornerUpRight size={13} />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* BG image */}
          <button
            onClick={promptBgImage}
            title="Set background image"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-zinc-500 hover:text-white tracking-widest border border-white/[0.06] hover:border-white/20 transition-all cursor-pointer"
          >
            <ImageIcon size={11} /> BG
          </button>

          {/* Delete */}
          {note && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete note"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-red-600 hover:text-red-400 border border-red-900/30 hover:border-red-600/40 tracking-widest transition-all cursor-pointer"
            >
              <Trash2 size={11} />
            </button>
          )}

          {/* Close */}
          <button
            onClick={handleSaveAndClose}
            title="Save and close"
            className="p-1.5 text-zinc-600 hover:text-white transition-colors cursor-pointer ml-1"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] px-6 pb-32">

          {/* Title + meta */}
          <div className="pt-10 pb-4">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={e => { pushStateToHistory(e.target.value, blocks); setTitle(e.target.value); }}
              placeholder="Untitled"
              className="w-full bg-transparent border-none text-3xl font-bold text-white placeholder-zinc-800 focus:outline-none focus:ring-0 mb-1 tracking-tight"
            />
            <div className="flex items-center gap-3 text-[10px] text-zinc-600 tracking-widest uppercase">
              <span>{category}</span>
              <span>·</span>
              <span>{blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}</span>
            </div>
          </div>

          {/* Blocks */}
          <div className="pt-4">
            {viewMode === 'edit' ? (
              <div className="space-y-1">
                {blocks.map((block, idx) => (
                  <MarkdownEditorBlock
                    key={block.id}
                    block={block}
                    index={idx}
                    totalBlocks={blocks.length}
                    isActive={activeBlockId === block.id}
                    onFocus={() => setActiveBlockId(block.id)}
                    onUpdate={(content, checked) => handleUpdateBlock(block.id, content, checked)}
                    onDelete={() => handleDeleteBlock(block.id)}
                    onMoveUp={() => handleMoveBlockUp(idx)}
                    onMoveDown={() => handleMoveBlockDown(idx)}
                  />
                ))}

                {/* Add block row */}
                <div className="flex items-center gap-2 pt-6">
                  <button
                    onClick={() => handleAddBlock('text')}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-zinc-600 hover:text-white border border-dashed border-white/10 hover:border-white/30 tracking-widest transition-all cursor-pointer"
                  >
                    <Plus size={10} /> TEXT BLOCK
                  </button>
                  <button
                    onClick={() => handleAddBlock('task')}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-zinc-600 hover:text-white border border-dashed border-white/10 hover:border-white/30 tracking-widest transition-all cursor-pointer"
                  >
                    <Plus size={10} /> TASK BLOCK
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {blocks.map(b => {
                  if (b.type === 'text') {
                    return (
                      <div key={b.id}>
                        <MarkdownRenderer content={b.content} />
                      </div>
                    );
                  }
                  return (
                    <div key={b.id} className="flex items-start gap-3 py-1 px-0.5">
                      <div className={`mt-[3px] w-4 h-4 shrink-0 border flex items-center justify-center ${
                        b.checked ? 'bg-white border-white' : 'border-zinc-600'
                      }`}>
                        {b.checked && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3.5 6L8 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-mono leading-relaxed ${
                        b.checked ? 'line-through text-zinc-600' : 'text-zinc-300'
                      }`}>
                        {b.content || <span className="text-zinc-700 italic">empty task</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Delete note confirmation */}
    <ConfirmDialog
      isOpen={showDeleteConfirm}
      title="DELETE NOTE"
      message={`Delete "${title || 'Untitled'}" permanently? This cannot be undone.`}
      confirmLabel="DELETE"
      onConfirm={() => {
        if (note) { onDelete(note.id); onClose(); }
        setShowDeleteConfirm(false);
      }}
      onCancel={() => setShowDeleteConfirm(false)}
    />

    {/* Background image URL dialog */}
    <InputDialog
      isOpen={showBgDialog}
      title="SET BACKGROUND IMAGE"
      placeholder="https://example.com/image.jpg"
      defaultValue={bg}
      confirmLabel="SET"
      onConfirm={url => { setBg(url); setShowBgDialog(false); }}
      onCancel={() => setShowBgDialog(false)}
    />
  </>
  );
};
