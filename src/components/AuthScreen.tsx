/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const AuthScreen = () => {
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const friendlyError = (code: string) => {
    const map: Record<string, string> = {
      'auth/invalid-credential':    'Invalid email or password.',
      'auth/user-not-found':        'No account with that email.',
      'auth/wrong-password':        'Incorrect password.',
      'auth/email-already-in-use':  'An account with this email already exists.',
      'auth/weak-password':         'Password must be at least 6 characters.',
      'auth/invalid-email':         'Invalid email address.',
      'auth/too-many-requests':     'Too many attempts. Try again later.',
      'auth/popup-closed-by-user':  'Sign-in popup was closed.',
    };
    return map[code] || 'Something went wrong. Try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setGLoading(false);
    }
  };

  return (
    <div className="bg-[#090909] text-white min-h-screen flex items-center justify-center font-mono px-4">
      <div className="w-full max-w-[360px]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 font-bold tracking-tight text-sm mb-10">
          <span className="bg-white text-black px-1.5 py-0.5 text-xs font-black tracking-wide">#</span>
          NOTES
        </div>

        <h1 className="text-lg font-bold tracking-tight mb-1">
          {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </h1>
        <p className="text-[11px] text-zinc-600 tracking-widest mb-8">
          {mode === 'login' ? 'Access your notes.' : 'Start writing.'}
        </p>

        {/* Google sign-in */}
        <button
          onClick={handleGoogle}
          disabled={gLoading}
          className="w-full flex items-center justify-center gap-3 border border-[#2a2a2a] hover:border-white bg-[#111] hover:bg-[#1a1a1a] text-sm text-zinc-300 hover:text-white py-2.5 px-4 transition-all duration-150 cursor-pointer disabled:opacity-50 mb-5"
        >
          {gLoading ? (
            <span className="text-xs tracking-widest">...</span>
          ) : (
            <>
              {/* Google G icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-xs tracking-widest font-bold">CONTINUE WITH GOOGLE</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#1e1e1e]" />
          <span className="text-[10px] text-zinc-700 tracking-widest">OR</span>
          <div className="flex-1 h-px bg-[#1e1e1e]" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] text-zinc-600 tracking-widest mb-1.5 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@example.com"
              className="w-full bg-[#111] border border-[#222] hover:border-[#333] focus:border-white text-white text-sm px-3 py-2.5 outline-none font-mono transition-colors placeholder-zinc-700"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-600 tracking-widest mb-1.5 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#111] border border-[#222] hover:border-[#333] focus:border-white text-white text-sm px-3 py-2.5 outline-none font-mono transition-colors placeholder-zinc-700"
            />
          </div>

          {error && <p className="text-[11px] text-red-500 tracking-wide pt-1">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black text-xs font-bold tracking-widest py-2.5 hover:opacity-90 active:scale-[0.99] transition-all duration-100 disabled:opacity-50 cursor-pointer mt-1"
          >
            {loading ? '...' : mode === 'login' ? 'SIGN_IN' : 'CREATE_ACCOUNT'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-[11px] text-zinc-600 hover:text-white tracking-widest transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'No account? Register' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
