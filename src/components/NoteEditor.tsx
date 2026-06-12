/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronDown, Image as ImageIcon, Eye, EyeOff, Trash2, Plus, CornerUpLeft, CornerUpRight, FileText, CheckSquare, Layers } from 'lucide-react';
import { Note, Block, BlockType } from '../types';
import { MarkdownEditorBlock } from './MarkdownEditorBlock';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NoteEditorProps {
  note: Note | null; // null means new note
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
  // Local note editing state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [bg, setBg] = useState('');
  const [dimmed, setDimmed] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // View state: 'edit' (block by block editing) or 'preview' (unified compilation rendered in HTML/Markdown)
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  
  // Custom category dropdown status
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Undo / Redo Stacks (stored in refs for raw speed and to prevent state mismatch)
  const historyStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const lastPushedState = useRef<string>('');

  // Setup/Sync local state when note changes
  useEffect(() => {
    if (isOpen) {
      historyStack.current = [];
      redoStack.current = [];
      setViewMode('edit');
      
      if (note) {
        setTitle(note.title);
        setCategory(note.category);
        setBg(note.bg);
        setDimmed(note.dimmed);
        // Ensure each block has an id for safe React rendering (guard against missing blocks in older saved notes)
        const blocksWithIds = (note.blocks ?? []).map(b => ({
          ...b,
          id: b.id || Math.random().toString(36).substring(2, 9)
        }));
        setBlocks(blocksWithIds);
        lastPushedState.current = JSON.stringify({ title: note.title, blocks: blocksWithIds });
      } else {
        setTitle('');
        setCategory(categories[0] || 'GENERAL');
        setBg('');
        setDimmed(false);
        const initialBlocks = [{ id: Math.random().toString(36).substring(2, 9), type: 'text' as BlockType, content: '' }];
        setBlocks(initialBlocks);
        lastPushedState.current = JSON.stringify({ title: '', blocks: initialBlocks });
      }
    }
  }, [note, isOpen, categories]);

  // Click outside to close category dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard capture for Global Undo/Redo inside the active editor
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    document.addEventListener('keydown', handleGlobalKeys);
    return () => document.removeEventListener('keydown', handleGlobalKeys);
  }, [isOpen, title, blocks]);

  // Helper: push state for undo tracking
  const pushStateToHistory = (customTitle = title, customBlocks = blocks) => {
    const nextState = { title: customTitle, blocks: customBlocks };
    const serialized = JSON.stringify(nextState);
    
    // Only push if different from last saved history capture
    if (serialized !== lastPushedState.current) {
      historyStack.current.push(lastPushedState.current);
      lastPushedState.current = serialized;
      redoStack.current = []; // Clear redo stack on manual state push
      
      // Limit history stack size
      if (historyStack.current.length > 50) {
        historyStack.current.shift();
      }
    }
  };

  const handleUndo = () => {
    if (historyStack.current.length === 0) return;
    
    // Capture current state of input for redo stack
    const currentSerialized = JSON.stringify({ title, blocks });
    redoStack.current.push(currentSerialized);
    
    // Pop and apply history
    const previousStateStr = historyStack.current.pop()!;
    const previousState = JSON.parse(previousStateStr);
    
    setTitle(previousState.title);
    setBlocks(previousState.blocks);
    lastPushedState.current = previousStateStr;
  };

  const handleRedo = () => {
    if (redoStack.current.length === 0) return;
    
    // Capture state for undo stack
    const currentSerialized = JSON.stringify({ title, blocks });
    historyStack.current.push(currentSerialized);
    
    // Pop and apply redo
    const nextStateStr = redoStack.current.pop()!;
    const nextState = JSON.parse(nextStateStr);
    
    setTitle(nextState.title);
    setBlocks(nextState.blocks);
    lastPushedState.current = nextStateStr;
  };

  // Block handlers
  const handleUpdateBlock = (id: string, content: string, checked?: boolean) => {
    // Determine if we should push history (push snapshot *before* modifying state)
    // To prevent spamming history on every single keystroke, we snap before updates or periodically
    const timerId = setTimeout(() => {
      pushStateToHistory(title, blocks);
    }, 400);

    setBlocks(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, content, checked };
      }
      return b;
    }));

    return () => clearTimeout(timerId);
  };

  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      // Don't leave document with absolutely 0 elements, clear out instead
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
      checked: type === 'task' ? false : undefined
    };
    
    setBlocks(prev => [...prev, newBlock]);
    setActiveBlockId(newBlock.id);

    // Dynamic focus
    setTimeout(() => {
      const editorBlock = document.getElementById(`editor-block-${blocks.length}`);
      if (editorBlock) {
        editorBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  // Block Navigation Actions
  const handleMoveBlockUp = (index: number) => {
    if (index === 0) return;
    pushStateToHistory();
    setBlocks(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const handleMoveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    pushStateToHistory();
    setBlocks(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  // Save changes and exit
  const handleSaveAndClose = () => {
    const finalTitle = title.trim() || 'UNTITLED';
    // Clean blank block items
    const filledBlocks = blocks.filter(b => b.content.trim() !== '');
    
    const savedNote: Note = {
      id: note ? note.id : Date.now(),
      title: finalTitle,
      category,
      bg,
      dimmed,
      blocks: filledBlocks.length > 0 ? filledBlocks : [{ id: Math.random().toString(36).substring(2, 9), type: 'text', content: '' }]
    };

    onSave(savedNote);
    onClose();
  };

  // Background control
  const promptBgImage = () => {
    const url = prompt('ENTER IMAGE URL FOR BACKGROUND:');
    if (url !== null) {
      setBg(url);
    }
  };

  // Compile entire Note blocks into a single markdown string
  const compileFullMarkdown = (): string => {
    let md = `# ${title || 'UNTITLED'}\n\n`;
    blocks.forEach((b) => {
      if (b.type === 'text') {
        md += `${b.content}\n\n`;
      } else {
        md += `- [${b.checked ? 'x' : ' '}] ${b.content}\n`;
      }
    });
    return md;
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 w-full h-full bg-[#090909] z-100 flex flex-col transition-transform duration-200 select-none ${
        isOpen ? 'translate-y-0 opacity-100 pointer-events-all' : 'translate-y-5 opacity-0 pointer-events-none'
      }`}
    >
      {/* Background Graphic Layer */}
      {bg && (
        <div 
          className="absolute inset-0 bg-cover bg-center -z-1 transition-opacity duration-300 pointer-events-none"
          style={{ backgroundImage: `url('${bg}')` }}
        />
      )}
      
      <div 
        className="absolute inset-0 bg-[#090909] -z-1 transition-opacity duration-300 pointer-events-none opacity-[0.92]"
      />

      {/* Editor top header actions */}
      <div className="w-full border-b border-[#333333] px-6 py-4 flex flex-wrap justify-between items-center gap-3 bg-[#090909]/95 backdrop-blur-[4px] z-10 relative select-none">
        
        {/* Left Side: Back & Category Dropdown */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSaveAndClose}
            className="text-xs font-bold font-mono tracking-widest text-[#888888] hover:text-white transition-colors duration-150 flex items-center gap-2 border-r border-[#333333] pr-4 cursor-pointer"
          >
            <ArrowLeft size={14} /> BACK
          </button>

          {/* Custom sharp category select dropdown */}
          <div className="relative" ref={selectRef}>
            <div 
              onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
              className="flex items-center justify-between border border-[#333333] hover:border-white px-3 py-1.5 text-[11px] text-zinc-300 font-mono tracking-wider min-w-[130px] bg-[#090909] cursor-pointer select-none"
            >
              <span className="font-bold text-white uppercase">{category}</span>
              <ChevronDown size={11} className="text-zinc-500" />
            </div>

            {isCatDropdownOpen && (
              <div className="absolute top-[100%] left-0 right-0 max-h-[180px] bg-[#121212] border border-[#333333] border-t-0 z-50 overflow-y-auto shadow-xl">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      setIsCatDropdownOpen(false);
                    }}
                    className="p-2.5 text-[11px] text-[#888888] font-mono hover:bg-white hover:text-black transition-colors duration-100 cursor-pointer uppercase font-bold"
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic tabs: Segmented Edit or Full Markdown Document view */}
          <div className="flex border border-[#333333] p-0.5 bg-black ml-1 select-none">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1 text-[10px] tracking-widest font-mono cursor-pointer flex items-center gap-1.5 duration-150 ${
                viewMode === 'edit' 
                  ? 'bg-white text-black font-bold' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <FileText size={10} /> BLOCKS
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-[10px] tracking-widest font-mono cursor-pointer flex items-center gap-1.5 duration-150 ${
                viewMode === 'preview' 
                  ? 'bg-white text-black font-bold' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Layers size={10} /> PREVIEW
            </button>
          </div>
        </div>

        {/* Right Side: Backdrops, Dim overlay and delete */}
        <div className="flex items-center gap-2">
          <button 
            onClick={promptBgImage}
            className="border border-[#333333] hover:border-white hover:bg-[#1e1e1e] px-3 py-1.5 text-xs text-zinc-400 hover:text-white font-mono tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            title="Set Background Image"
          >
            <ImageIcon size={12} /> BG
          </button>
          {note && (
            <button 
              onClick={() => {
                if (confirm('DELETE_ENTRY_PERMANENTLY?')) {
                  onDelete(note.id);
                  onClose();
                }
              }}
              className="border border-red-950/40 text-red-500 hover:border-red-500 hover:bg-red-950/10 px-3 py-1.5 text-xs font-mono transition-all duration-100 flex items-center gap-1.5 cursor-pointer"
              title="Delete Entry"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Editor Body Area */}
      <div className="flex-1 w-full overflow-y-auto select-text scrollbar-mono flex justify-center py-6 px-4 md:px-12">
        <div className="w-full max-w-[800px] mb-48">
          
          {/* Note Slate Title Box */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              pushStateToHistory(e.target.value, blocks);
              setTitle(e.target.value);
            }}
            placeholder="UNTITLED_NOTE"
            className="w-full bg-transparent border-none text-2xl md:text-3.5xl font-extrabold focus:ring-0 outline-none mb-6 font-mono tracking-tight text-white placeholder-zinc-800"
          />

          {viewMode === 'edit' ? (
            /* Sub-component Block List Editor */
            <div className="mt-4 space-y-2">
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
            </div>
          ) : (
            /* Compiled View Mode */
            <div className="border border-zinc-800 bg-[#0c0c0c]/90 px-6 py-8 md:px-8 mt-4 rounded-none select-text shadow-2xl">
              <MarkdownRenderer content={compileFullMarkdown()} />
            </div>
          )}

        </div>
      </div>

      {/* Embedded footer floating toolbar */}
      <div className="fixed bottom-8 left-[50%] -translate-x-[50%] bg-[#121212]/95 border border-[#333333] p-1.5 flex gap-2 items-center shadow-2xl z-[150] select-none rounded-none backdrop-blur-[2px]">
        {/* Undo/Redo Controls */}
        <div className="flex gap-0.5 border-r border-[#333333] pr-2 mr-1">
          <button 
            onClick={handleUndo}
            disabled={historyStack.current.length === 0}
            className={`p-1.5 border border-[#1e1e1e] font-mono hover:bg-[#1e1e1e] text-xs flex items-center justify-center transition-all ${
              historyStack.current.length > 0 
                ? 'text-white hover:border-white duration-100 cursor-pointer' 
                : 'text-zinc-700 hover:border-transparent opacity-40 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <CornerUpLeft size={13} />
          </button>
          <button 
            onClick={handleRedo}
            disabled={redoStack.current.length === 0}
            className={`p-1.5 border border-[#1e1e1e] font-mono hover:bg-[#1e1e1e] text-xs flex items-center justify-center transition-all ${
              redoStack.current.length > 0 
                ? 'text-white hover:border-white duration-100 cursor-pointer' 
                : 'text-zinc-700 hover:border-transparent opacity-40 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <CornerUpRight size={13} />
          </button>
        </div>

        {/* Add Blocks Options */}
        <button 
          onClick={() => handleAddBlock('text')}
          className="border border-[#1e1e1e] hover:border-zinc-400 hover:bg-[#1a1a1a] px-3.5 py-1.5 text-[10px] text-zinc-400 hover:text-white font-mono font-bold tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={12} /> TEXT
        </button>
        <button 
          onClick={() => handleAddBlock('task')}
          className="border border-[#1e1e1e] hover:border-zinc-400 hover:bg-[#1a1a1a] px-3.5 py-1.5 text-[10px] text-zinc-400 hover:text-white font-mono font-bold tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <CheckSquare size={12} /> TASK
        </button>
      </div>
    </div>
  );
};
