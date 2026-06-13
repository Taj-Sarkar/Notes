/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Folder, Plus, Trash2, Edit2, X, GripVertical } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { InputDialog } from './InputDialog';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (cat: string) => void;
  onRenameCategory: (oldCat: string, newCat: string) => void;
  onDeleteCategory: (cat: string) => void;
  onReorderCategories: (cats: string[]) => void;
}

export const CategoryManager = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategories,
}: CategoryManagerProps) => {
  const [newCat, setNewCat] = useState('');

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Rename dialog state
  const [renameTarget, setRenameTarget] = useState<string | null>(null);

  // Drag reordering states
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [touchDraggedIdx, setTouchDraggedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAdd = () => {
    const formatted = newCat.trim().toUpperCase();
    if (formatted) { onAddCategory(formatted); setNewCat(''); }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const updated = [...categories];
    const draggedItem = updated[draggedIdx];
    updated.splice(draggedIdx, 1);
    updated.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    onReorderCategories(updated);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    setTouchDraggedIdx(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDraggedIdx === null) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    const draggableRow = element.closest('[data-drag-index]');
    if (!draggableRow) return;
    const targetIdx = parseInt(draggableRow.getAttribute('data-drag-index') || '', 10);
    if (isNaN(targetIdx) || targetIdx === touchDraggedIdx) return;
    const updated = [...categories];
    const draggedItem = updated[touchDraggedIdx];
    updated.splice(touchDraggedIdx, 1);
    updated.splice(targetIdx, 0, draggedItem);
    setTouchDraggedIdx(targetIdx);
    onReorderCategories(updated);
  };

  const handleTouchEnd = () => {
    setTouchDraggedIdx(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-[2px] flex justify-center items-center z-[200]">
        <div className="bg-[#090909] border border-[#333333] w-[calc(100%-2rem)] sm:w-full max-w-[420px] p-6 font-mono select-none">

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
              <Folder size={16} /> // CATEGORIES
            </h3>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1">
              <X size={16} />
            </button>
          </div>

          {/* Add new */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="NEW CATEGORY"
              className="flex-1 bg-transparent border border-[#333333] p-2 text-xs text-white uppercase outline-none font-mono focus:border-white transition-colors placeholder-zinc-700"
            />
            <button
              onClick={handleAdd}
              className="bg-white text-black border border-white px-4 text-xs font-bold font-mono tracking-wider hover:opacity-90 active:scale-95 duration-100 flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> ADD
            </button>
          </div>

          {/* List */}
          <div className="max-h-[250px] overflow-y-auto mb-6 pr-1 space-y-1 scrollbar-mono">
            {categories.map((cat, idx) => {
              const isDragged = draggedIdx === idx || touchDraggedIdx === idx;
              return (
                <div
                  key={cat}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, idx)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  data-drag-index={idx}
                  className={`flex justify-between items-center py-2.5 px-3 border-b border-[#1e1e1e] hover:bg-[#121212] group transition-colors duration-150 cursor-grab active:cursor-grabbing select-none ${
                    isDragged ? 'opacity-40 bg-[#1e1e1e]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="text-zinc-600 group-hover:text-zinc-400 shrink-0">
                      <GripVertical size={12} />
                    </div>
                    <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors truncate">
                      {cat}
                    </span>
                  </div>

                  <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setRenameTarget(cat)}
                      className="p-1.5 border border-[#333333] hover:border-white hover:bg-[#1e1e1e] transition-all text-zinc-400 hover:text-white cursor-pointer"
                      title="Rename"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="p-1.5 border border-red-950/40 hover:border-red-500 hover:bg-red-950/15 text-red-700 hover:text-red-400 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-full text-center py-2.5 border border-[#333333] hover:border-white hover:bg-[#121212] text-xs font-bold text-zinc-500 hover:text-white transition-all tracking-widest cursor-pointer"
          >
            // CLOSE
          </button>
        </div>
      </div>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="DELETE CATEGORY"
        message={`Delete "${deleteTarget}"? All notes in this category will fall back to the first available category.`}
        confirmLabel="DELETE"
        onConfirm={() => {
          if (deleteTarget) onDeleteCategory(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Rename dialog */}
      <InputDialog
        isOpen={renameTarget !== null}
        title="RENAME CATEGORY"
        placeholder="New name"
        defaultValue={renameTarget ?? ''}
        confirmLabel="RENAME"
        onConfirm={value => {
          if (renameTarget) onRenameCategory(renameTarget, value.toUpperCase());
          setRenameTarget(null);
        }}
        onCancel={() => setRenameTarget(null)}
      />
    </>
  );
};
