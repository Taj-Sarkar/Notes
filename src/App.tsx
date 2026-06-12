/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Folder, Plus, ChevronDown, Filter } from 'lucide-react';
import { Note, Block } from './types';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { CategoryManager } from './components/CategoryManager';

// Default initial data for nice out-of-the-box system demo
const DEFAULT_CATEGORIES = ['PERSONAL', 'WORK', 'IDEAS', 'CODE'];

const DEFAULT_NOTES: Note[] = [
  {
    id: 1,
    title: 'DESIGN_SYSTEM',
    category: 'WORK',
    bg: '',
    dimmed: false,
    blocks: [
      {
        id: '1',
        type: 'text',
        content: '# MONOCHROMATIC_DESIGN_GUIDE\n\nThis design system uses a single base color and its shade variants. Perfect for concentrated writing.\n\n### FEATURES\n- **Robust Markdown rendering**\n- Live block-by-block edits or standard unified preview\n- Multilingual syntax-highlighted code blocks\n- Non-destructive **Undo & Redo** stack',
      },
      { id: '2', type: 'task', content: 'Implement Markdown blocks with code syntax highlights', checked: true },
      { id: '3', type: 'task', content: 'Design sharp, borders-only interface widgets', checked: true },
    ],
  },
  {
    id: 2,
    title: 'MARKDOWN_SAMPLES',
    category: 'CODE',
    bg: '',
    dimmed: false,
    blocks: [
      {
        id: '4',
        type: 'text',
        content: '## SYNTAX HIGHLIGHT DEMO\n\nBelow is a highlighted code sample written in TypeScript:\n\n```typescript\ninterface EditorEngine {\n  markdown: boolean;\n  monoStyles: string[];\n  syntaxHighlighting: "prism";\n}\n\nconst initEngine = (): EditorEngine => {\n  return {\n    markdown: true,\n    monoStyles: ["sharp", "contrast", "dark"],\n    syntaxHighlighting: "prism"\n  };\n};\n```\n\nYou can copy it using the action tag above!',
      }
    ]
  }
];

export default function App() {
  // Sync state with LocalStorage or fall backs to initial constants
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('mono_cats');
      return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const stored = localStorage.getItem('mono_notes');
      const parsed: Note[] = stored ? JSON.parse(stored) : DEFAULT_NOTES;
      // Backfill missing blocks array from older saved data
      return parsed.map(n => ({ ...n, blocks: n.blocks ?? [] }));
    } catch {
      return DEFAULT_NOTES;
    }
  });

  // Filters State
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener for the category dropdown filter
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Popup / Screen modal state
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Persistence side effects
  useEffect(() => {
    localStorage.setItem('mono_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('mono_cats', JSON.stringify(categories));
  }, [categories]);

  // Handler: Add a Category
  const handleAddCategory = (newCat: string) => {
    if (newCat && !categories.includes(newCat)) {
      setCategories(prev => [...prev, newCat]);
    } else if (categories.includes(newCat)) {
      alert('CATEGORY ALREADY EXISTS');
    }
  };

  // Handler: Rename Category and cascade changes to existing notes
  const handleRenameCategory = (oldCat: string, newCat: string) => {
    if (categories.includes(newCat)) {
      alert('EXISTS');
      return;
    }
    setCategories(prev => prev.map(c => (c === oldCat ? newCat : c)));
    setNotes(prev => prev.map(note => {
      if (note.category === oldCat) {
        return { ...note, category: newCat };
      }
      return note;
    }));
  };

  // Handler: Delete Category and falls notes back to the first available category
  const handleDeleteCategory = (catToDelete: string) => {
    const updatedCats = categories.filter(c => c !== catToDelete);
    const fallbackCat = updatedCats[0] || 'GENERAL';
    
    setCategories(updatedCats.length > 0 ? updatedCats : [fallbackCat]);
    setNotes(prev => prev.map(note => {
      if (note.category === catToDelete) {
        return { ...note, category: fallbackCat };
      }
      return note;
    }));
  };

  // Handler: Save/Update Note from full editor panel
  const handleSaveNote = (savedNote: Note) => {
    setNotes(prev => {
      const exists = prev.some(n => n.id === savedNote.id);
      if (exists) {
        return prev.map(n => (n.id === savedNote.id ? savedNote : n));
      } else {
        return [savedNote, ...prev]; // Prepend new note items
      }
    });
  };

  // Handler: Delete Note completely
  const handleDeleteNote = (id: number) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // Filter notes computed list
  const filteredNotes = activeFilter === 'ALL'
    ? notes
    : notes.filter(n => n.category === activeFilter);

  return (
    <div className="bg-[#090909] text-white min-h-screen flex flex-col font-mono selection:bg-white selection:text-black">
      
      {/* MONO NOTE header bar */}
      <header className="px-6 md:px-8 py-5 border-b border-[#333333] flex flex-col sm:flex-row justify-between items-center bg-[#090909] sticky top-0 z-50 select-none gap-4">
        <div className="flex items-center gap-2.5 font-bold tracking-tight text-sm md:text-base select-none">
          <span className="bg-white text-black px-1.5 py-0.5 text-xs font-black tracking-wide">
            M
          </span>
          MONO_NOTE
        </div>

        {/* Right Header Navigation & Actions Group */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {/* Categories Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="flex items-center justify-between border border-[#333333] hover:border-white px-3 py-1.5 text-[11px] font-bold text-white uppercase font-mono tracking-wider min-w-[140px] bg-[#0c0c0c] cursor-pointer select-none outline-none focus:outline-none transition-colors duration-150"
            >
              <span className="truncate">{activeFilter}</span>
              <ChevronDown size={11} className="text-zinc-500 ml-2 shrink-0" />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute top-[100%] right-0 w-full min-w-[140px] max-h-[220px] bg-[#121212] border border-[#333333] border-t-0 z-40 overflow-y-auto scrollbar-mono shadow-2xl">
                <div
                  onClick={() => {
                    setActiveFilter('ALL');
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`p-3 text-[11px] font-mono tracking-wider hover:bg-white hover:text-black cursor-pointer uppercase transition-colors duration-100 font-bold ${
                    activeFilter === 'ALL' ? 'text-white bg-[#1e1e1e]' : 'text-[#888888]'
                  }`}
                >
                  ALL
                </div>
                {categories.map((cat) => (
                  <div
                    key={cat}
                    onClick={() => {
                      setActiveFilter(cat);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`p-3 text-[11px] font-mono tracking-wider hover:bg-white hover:text-black cursor-pointer uppercase transition-colors duration-100 font-bold ${
                      activeFilter === cat ? 'text-white bg-[#1e1e1e]' : 'text-[#888888]'
                    }`}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-[#333333] hidden sm:block"></div>

          {/* Header Action controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCatManagerOpen(true)}
              className="p-2 border border-[#333333] hover:border-white hover:bg-[#1a1a1a] transition-all duration-150 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              title="Manage Categories"
            >
              <Folder size={14} />
            </button>
            
            <button
              onClick={() => {
                setSelectedNote(null);
                setIsEditorOpen(true);
              }}
              className="bg-white text-black border border-white px-4 py-2 text-xs font-bold tracking-wider hover:opacity-90 active:scale-95 duration-100 flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <Plus size={14} /> NEW_ENTRY
            </button>
          </div>
        </div>
      </header>

      {/* Cards List Workspace Grid */}
      <main className="flex-1 px-6 md:px-8 py-8">
        {filteredNotes.length === 0 ? (
          <div className="text-center text-[#444444] font-bold text-xs tracking-widest mt-24 select-none">
            // NO_DATA_AVAILABLE
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => {
                  setSelectedNote(note);
                  setIsEditorOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sidebar / Dialog manager panels */}
      <CategoryManager
        isOpen={isCatManagerOpen}
        onClose={() => setIsCatManagerOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <NoteEditor
        isOpen={isEditorOpen}
        note={selectedNote}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedNote(null);
        }}
        categories={categories}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />
    </div>
  );
}
