import React, { useState } from 'react';
import { ProfileType } from '../types';
import { getProfileTemplate } from '../data';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (name: string, profile: ProfileType) => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<ProfileType>('single');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name.trim(), profile);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-6 border-b border-slate-100 bg-indigo-50 shrink-0">
          <h2 className="text-2xl font-bold text-indigo-600">Selamat Datang!</h2>
          <p className="text-slate-600 mt-2 text-sm">Mari kita mulai dengan mengatur profil dasar Anda untuk merencanakan anggaran UMKM.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Anda</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              placeholder="Masukkan nama"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status Profil</label>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value as ProfileType)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="single">Single Life</option>
              <option value="married">Married Life</option>
              <option value="family">Family Life</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            Mulai Gunakan App
          </button>
        </form>
      </div>
    </div>
  );
}
