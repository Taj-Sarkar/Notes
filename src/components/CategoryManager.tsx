/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Folder, Plus, Trash2, Edit2, X } from 'lucide-react';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (cat: string) => void;
  onRenameCategory: (oldCat: string, newCat: string) => void;
  onDeleteCategory: (cat: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const [newCat, setNewCat] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    const formatted = newCat.trim().toUpperCase();
    if (formatted) {
      onAddCategory(formatted);
      setNewCat('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-[2px] flex justify-center items-center z-[200] transition-opacity duration-200">
      <div className="bg-[#090909] border border-[#333333] w-full max-w-[420px] p-6 font-mono select-none">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
            <Folder size={16} /> // CATEGORIES
          </h3>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors duration-150 cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="NEW CATEGORY"
            className="flex-1 bg-transparent border border-[#333333] p-2 text-xs text-white uppercase outline-none font-mono focus:border-white transition-colors duration-150 placeholder-zinc-700"
          />
          <button 
            onClick={handleAdd}
            className="bg-white text-black border border-white px-4 text-xs font-bold font-mono tracking-wider hover:opacity-90 active:scale-95 duration-100 flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> ADD
          </button>
        </div>

        <div className="max-h-[250px] overflow-y-auto mb-6 pr-1 space-y-1 scrollbar-mono">
          {categories.map((cat) => (
            <div 
              key={cat}
              className="flex justify-between items-center py-2.5 px-3 border-b border-[#1e1e1e] hover:bg-[#121212] group transition-colors duration-150"
            >
              <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors duration-150">{cat}</span>
              <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
                <button 
                  onClick={() => {
                    const newName = prompt('RENAME CATEGORY:', cat);
                    if (newName) {
                      const formatted = newName.trim().toUpperCase();
                      if (formatted && formatted !== cat) {
                        onRenameCategory(cat, formatted);
                      }
                    }
                  }}
                  className="p-1.5 border border-[#333333] hover:border-white hover:bg-[#1e1e1e] transition-all duration-150 text-zinc-400 hover:text-white cursor-pointer"
                  title="Rename"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`DELETE "${cat}"? ALL NOTES ASSOCIATED WITH IT WILL FALL BACK TO FIRST CATEGORY.`)) {
                      onDeleteCategory(cat);
                    }
                  }}
                  className="p-1.5 border border-red-950/40 hover:border-red-500 hover:bg-red-950/15 text-red-700 hover:text-red-400 transition-all duration-150 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full text-center py-2.5 border border-[#333333] hover:border-white hover:bg-[#121212] text-xs font-bold text-zinc-500 hover:text-white transition-all duration-150 tracking-widest cursor-pointer"
        >
          // CLOSE
        </button>
      </div>
    </div>
  );
};
