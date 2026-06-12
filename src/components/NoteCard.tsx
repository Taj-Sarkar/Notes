/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
  // Format Date gracefully (e.g. 12/06/2026)
  const formattedDate = new Date(note.id).toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Compile previews for first 4 blocks (guard against missing blocks in older saved notes)
  const blocks = note.blocks ?? [];
  const previewBlocks = blocks.slice(0, 4);

  return (
    <div
      onClick={onClick}
      className={`relative h-[280px] p-6 bg-[#121212] border border-[#333333] hover:border-white hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group select-none ${
        note.dimmed ? 'dimmed' : ''
      }`}
      id={`note-card-${note.id}`}
    >
      {/* Background Graphic Layer of Card */}
      {note.bg && (
        <div
          className="absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-200"
          style={{ backgroundImage: `url('${note.bg}')` }}
        />
      )}

      {/* Dimmed Overlay Shield layer inside Card */}
      <div
        className={`absolute inset-0 bg-black/85 z-10 transition-opacity duration-200 ${
          note.dimmed ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
        }`}
      />

      {/* Main Content inside Card */}
      <div className="relative z-20 h-full flex flex-col justify-between font-mono">
        <div>
          {/* Card meta row */}
          <div className="flex justify-between items-center text-[10px] text-[#888888] uppercase tracking-wider font-bold mb-4">
            <span className="text-white">
              {note.category}
            </span>
            <span>{formattedDate}</span>
          </div>

          {/* Card Title */}
          <h4 className="text-sm md:text-base font-extrabold text-white leading-tight mb-3 line-clamp-2 uppercase tracking-tight group-hover:text-zinc-200">
            {note.title || 'UNTITLED'}
          </h4>
        </div>

        {/* Card Body Preview (max 4 blocks) */}
        <div className="flex-1 overflow-hidden space-y-1.5 text-xs text-[#888888] group-hover:text-zinc-400 duration-150 relative mask-gradient mt-2">
          {previewBlocks.map((b) => {
            if (b.type === 'text') {
              // Clean out Markdown headings, bold markers, or link tags
              const cleanPreview = b.content
                .replace(/[#*`>]/g, '') // remove markdown indicators
                .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Extract link text
                .trim();
              
              return (
                <div key={b.id} className="truncate select-none font-medium leading-relaxed">
                  {cleanPreview || '// empty block'}
                </div>
              );
            } else {
              return (
                <div key={b.id} className="flex gap-2 items-center truncate select-none font-mono">
                  <span
                    className={`w-2 h-2 border border-[#888888] inline-block shrink-0 ${
                      b.checked ? 'bg-[#888888]' : 'bg-transparent'
                    }`}
                  />
                  <span className={`truncate ${b.checked ? 'line-through text-zinc-600' : ''}`}>
                    {b.content}
                  </span>
                </div>
              );
            }
          })}
          {blocks.length > 4 && (
            <div className="text-[9px] text-zinc-600 font-bold tracking-widest pt-1">
              // + {blocks.length - 4} MORE...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
