/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface InputDialogProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const InputDialog = ({
  isOpen,
  title,
  placeholder = '',
  defaultValue = '',
  confirmLabel = 'CONFIRM',
  onConfirm,
  onCancel,
}: InputDialogProps) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultValue]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onConfirm(value.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center font-mono px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-[380px] bg-[#0e0e0e] border border-[#252525] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
          <span className="text-xs font-bold tracking-widest text-white">{title}</span>
          <button onClick={onCancel} className="text-zinc-600 hover:text-white transition-colors cursor-pointer">
            <X size={13} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#111] border border-[#222] hover:border-[#333] focus:border-white text-white text-sm px-3 py-2.5 outline-none font-mono transition-colors placeholder-zinc-700"
          />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 text-[11px] tracking-widest text-zinc-500 hover:text-white border border-[#252525] hover:border-white/20 transition-all cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 py-2 text-[11px] tracking-widest font-bold bg-white text-black border border-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-40"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
