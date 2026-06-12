/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Folder, Plus, ChevronDown, Settings } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Note } from './types';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { CategoryManager } from './components/CategoryManager';
import { AuthScreen } from './components/AuthScreen';
import { SettingsPanel } from './components/SettingsPanel';

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
        content: '## SYNTAX HIGHLIGHT DEMO\n\nBelow is a highlighted code sample written in TypeScript:\n\n```typescript\ninterface EditorEngine {\n  markdown: boolean;\n  monoStyles: string[];\n  syntaxHighlighting: "prism";\n}\n\nconst initEngine = (): EditorEngine => {\n  return {\n    markdown: true,\n    monoStyles: ["sharp", "contrast", "dark"],\n    syntaxHighlighting: "prism"\n  };\n};\n```',
      },
    ],
  },
];

export default function App() {
  const [user, setUser]           = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen for auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  if (authLoading) return <Loader label="LOADING..." />;
  if (!user)       return <AuthScreen />;
  return <NotesApp user={user} />;
}

// ── Loader ─────────────────────────────────────────────────────────────────
function Loader({ label }: { label: string }) {
  return (
    <div className="bg-[#090909] text-white min-h-screen flex items-center justify-center font-mono">
      <div className="text-center space-y-3">
        <div className="w-5 h-5 border border-white/20 border-t-white animate-spin mx-auto" />
        <p className="text-[11px] text-zinc-600 tracking-widest">{label}</p>
      </div>
    </div>
  );
}

// ── Main app (authenticated) ───────────────────────────────────────────────
function NotesApp({ user }: { user: User }) {
  const notesDoc = doc(db, 'users', user.uid, 'app', 'notes');
  const catsDoc  = doc(db, 'users', user.uid, 'app', 'categories');

  const [notes, setNotes]           = useState<Note[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);

  const notesReady       = useRef(false);
  const catsReady        = useRef(false);
  const isEditorOpenRef  = useRef(false);

  // Firestore real-time listeners
  useEffect(() => {
    const unsubNotes = onSnapshot(notesDoc, snap => {
      if (!isEditorOpenRef.current) {
        if (snap.exists()) {
          setNotes((snap.data().list as Note[]).map(n => ({ ...n, blocks: n.blocks ?? [] })));
        } else {
          setDoc(notesDoc, { list: DEFAULT_NOTES });
          setNotes(DEFAULT_NOTES);
        }
      }
      notesReady.current = true;
      if (catsReady.current) setLoading(false);
    });

    const unsubCats = onSnapshot(catsDoc, snap => {
      if (snap.exists()) {
        setCategories(snap.data().list as string[]);
      } else {
        setDoc(catsDoc, { list: DEFAULT_CATEGORIES });
        setCategories(DEFAULT_CATEGORIES);
      }
      catsReady.current = true;
      if (notesReady.current) setLoading(false);
    });

    return () => { unsubNotes(); unsubCats(); };
  }, [user.uid]);

  // Write helpers
  const persistNotes = (updated: Note[]) => {
    setNotes(updated);
    setDoc(notesDoc, { list: updated });
  };

  const persistCategories = (updated: string[]) => {
    setCategories(updated);
    setDoc(catsDoc, { list: updated });
  };

  // Filters
  const [activeFilter, setActiveFilter]           = useState('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsFilterDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal state
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen]     = useState(false);
  const [isEditorOpen, setIsEditorOpen]         = useState(false);
  const [selectedNote, setSelectedNote]         = useState<Note | null>(null);

  useEffect(() => { isEditorOpenRef.current = isEditorOpen; }, [isEditorOpen]);

  // Handlers
  const handleAddCategory = (newCat: string) => {
    if (!newCat) return;
    if (categories.includes(newCat)) { alert('CATEGORY ALREADY EXISTS'); return; }
    persistCategories([...categories, newCat]);
  };

  const handleRenameCategory = (oldCat: string, newCat: string) => {
    if (categories.includes(newCat)) { alert('EXISTS'); return; }
    persistCategories(categories.map(c => c === oldCat ? newCat : c));
    persistNotes(notes.map(n => n.category === oldCat ? { ...n, category: newCat } : n));
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const updated  = categories.filter(c => c !== catToDelete);
    const fallback = updated[0] || 'GENERAL';
    persistCategories(updated.length > 0 ? updated : [fallback]);
    persistNotes(notes.map(n => n.category === catToDelete ? { ...n, category: fallback } : n));
  };

  const handleSaveNote = (savedNote: Note) => {
    const exists  = notes.some(n => n.id === savedNote.id);
    const updated = exists
      ? notes.map(n => n.id === savedNote.id ? savedNote : n)
      : [savedNote, ...notes];
    persistNotes(updated);
  };

  const handleDeleteNote = (id: number) => {
    persistNotes(notes.filter(n => n.id !== id));
  };

  const handleEditorClose = async () => {
    setIsEditorOpen(false);
    setSelectedNote(null);
    // Re-sync from Firestore after closing editor
    const snap = await getDoc(notesDoc);
    if (snap.exists()) {
      setNotes((snap.data().list as Note[]).map(n => ({ ...n, blocks: n.blocks ?? [] })));
    }
  };

  const filteredNotes = activeFilter === 'ALL'
    ? notes
    : notes.filter(n => n.category === activeFilter);

  if (loading) return <Loader label="SYNCING..." />;

  return (
    <div className="bg-[#090909] text-white min-h-screen flex flex-col font-mono selection:bg-white selection:text-black">

      {/* Header */}
      <header className="px-6 md:px-8 py-5 border-b border-[#333333] flex flex-col sm:flex-row justify-between items-center bg-[#090909] sticky top-0 z-50 select-none gap-4">
        <div className="flex items-center gap-2.5 font-bold tracking-tight text-sm md:text-base select-none">
          <span className="bg-white text-black px-1.5 py-0.5 text-xs font-black tracking-wide">#</span>
          NOTES
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {/* Category filter */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="flex items-center justify-between border border-[#333333] hover:border-white px-3 py-1.5 text-[11px] font-bold text-white uppercase font-mono tracking-wider min-w-[140px] bg-[#0c0c0c] cursor-pointer select-none outline-none transition-colors duration-150"
            >
              <span className="truncate">{activeFilter}</span>
              <ChevronDown size={11} className="text-zinc-500 ml-2 shrink-0" />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute top-[100%] right-0 w-full min-w-[140px] max-h-[220px] bg-[#121212] border border-[#333333] border-t-0 z-40 overflow-y-auto scrollbar-mono shadow-2xl">
                {['ALL', ...categories].map(cat => (
                  <div
                    key={cat}
                    onClick={() => { setActiveFilter(cat); setIsFilterDropdownOpen(false); }}
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

          <div className="w-[1px] h-4 bg-[#333333] hidden sm:block" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCatManagerOpen(true)}
              className="p-2 border border-[#333333] hover:border-white hover:bg-[#1a1a1a] transition-all duration-150 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              title="Manage Categories"
            >
              <Folder size={14} />
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 border border-[#333333] hover:border-white hover:bg-[#1a1a1a] transition-all duration-150 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              title="Settings"
            >
              <Settings size={14} />
            </button>

            <button
              onClick={() => { setSelectedNote(null); setIsEditorOpen(true); }}
              className="bg-white text-black border border-white px-4 py-2 text-xs font-bold tracking-wider hover:opacity-90 active:scale-95 duration-100 flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <Plus size={14} /> NEW_ENTRY
            </button>
          </div>
        </div>
      </header>

      {/* Notes grid */}
      <main className="flex-1 px-6 md:px-8 py-8">
        {filteredNotes.length === 0 ? (
          <div className="text-center text-[#444444] font-bold text-xs tracking-widest mt-24 select-none">
            // NO_DATA_AVAILABLE
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => { setSelectedNote(note); setIsEditorOpen(true); }}
              />
            ))}
          </div>
        )}
      </main>

      <CategoryManager
        isOpen={isCatManagerOpen}
        onClose={() => setIsCatManagerOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <NoteEditor
        isOpen={isEditorOpen}
        note={selectedNote}
        onClose={handleEditorClose}
        categories={categories}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />
    </div>
  );
}
