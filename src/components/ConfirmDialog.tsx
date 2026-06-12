/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'CONFIRM',
  onConfirm,
  onCancel,
  dangerous = true,
}: ConfirmDialogProps) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) confirmRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center font-mono px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-[360px] bg-[#0e0e0e] border border-[#252525] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            {dangerous && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
            <span className="text-xs font-bold tracking-widest text-white">{title}</span>
          </div>
          <button onClick={onCancel} className="text-zinc-600 hover:text-white transition-colors cursor-pointer">
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-[12px] text-zinc-400 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-[11px] tracking-widest text-zinc-500 hover:text-white border border-[#252525] hover:border-white/20 transition-all cursor-pointer"
          >
            CANCEL
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`flex-1 py-2 text-[11px] tracking-widest font-bold transition-all cursor-pointer ${
              dangerous
                ? 'bg-red-950/30 border border-red-900/50 text-red-400 hover:bg-red-950/60 hover:border-red-500'
                : 'bg-white text-black border border-white hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
