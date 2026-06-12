/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { X, LogOut, User } from 'lucide-react';
import {
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '../firebase';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const user = auth.currentUser;

  // Detect if signed in via Google (no password change available)
  const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com') ?? false;

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [pwMsg, setPwMsg]         = useState('');
  const [pwError, setPwError]     = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    onClose();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(''); setPwError('');
    if (!user?.email) return;
    setPwLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      setPwMsg('Password updated.');
      setCurrentPw(''); setNewPw('');
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/wrong-password':     'Current password is incorrect.',
        'auth/weak-password':      'New password must be at least 6 characters.',
        'auth/too-many-requests':  'Too many attempts. Try again later.',
        'auth/invalid-credential': 'Current password is incorrect.',
      };
      setPwError(msgs[err.code] || 'Something went wrong.');
    } finally {
      setPwLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center font-mono">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-[400px] bg-[#0e0e0e] border border-[#222] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
          <span className="text-xs font-bold tracking-widest">SETTINGS</span>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors cursor-pointer">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">

          {/* Account info */}
          <div>
            <p className="text-[10px] text-zinc-600 tracking-widest uppercase mb-3">Account</p>
            <div className="flex items-center gap-3 bg-[#141414] border border-[#1e1e1e] px-4 py-3">
              <div className="w-7 h-7 bg-white/10 flex items-center justify-center shrink-0">
                {isGoogleUser ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                ) : (
                  <User size={13} className="text-zinc-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-zinc-300 truncate">{user?.email}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  {isGoogleUser ? 'Google account' : 'Email account'}
                </p>
              </div>
            </div>
          </div>

          {/* Change password — only for email accounts */}
          {!isGoogleUser && (
            <div>
              <p className="text-[10px] text-zinc-600 tracking-widest uppercase mb-3">Change Password</p>
              <form onSubmit={handleChangePassword} className="space-y-2">
                <input
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  required
                  placeholder="Current password"
                  className="w-full bg-[#111] border border-[#222] focus:border-white text-white text-xs px-3 py-2 outline-none font-mono placeholder-zinc-700 transition-colors"
                />
                <input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  required
                  minLength={6}
                  placeholder="New password (min 6 chars)"
                  className="w-full bg-[#111] border border-[#222] focus:border-white text-white text-xs px-3 py-2 outline-none font-mono placeholder-zinc-700 transition-colors"
                />
                {pwError && <p className="text-[11px] text-red-500">{pwError}</p>}
                {pwMsg   && <p className="text-[11px] text-green-500">{pwMsg}</p>}
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full border border-[#333] hover:border-white text-xs text-zinc-400 hover:text-white py-2 tracking-widest transition-all cursor-pointer disabled:opacity-40"
                >
                  {pwLoading ? '...' : 'UPDATE_PASSWORD'}
                </button>
              </form>
            </div>
          )}

          {/* Sign out */}
          <div className="pt-1 border-t border-[#1a1a1a]">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 border border-red-900/30 hover:border-red-600/50 text-red-600 hover:text-red-400 text-xs py-2.5 tracking-widest transition-all cursor-pointer mt-4"
            >
              <LogOut size={12} /> SIGN_OUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
