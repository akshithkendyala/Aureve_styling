'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  RefreshCw,
  Trash2,
  Download,
  LogOut,
  User,
  Check,
  AlertCircle,
  Database,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [pinError, setPinError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMe();
  }, []);

  const handleSeedWardrobe = async () => {
    try {
      const res = await fetch('/api/wardrobe/seed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActionMessage(data.message || 'Starter wardrobe added.');
        setTimeout(() => setActionMessage(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/wardrobe?includeArchived=true');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aureve-wardrobe-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-[#7E6047]">
          Account & Security
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#18181B] tracking-tight">
          Settings & Privacy
        </h1>
        <p className="text-xs sm:text-sm text-[#7E6047] mt-1">
          Manage your private security PIN, wardrobe data, and account preferences.
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 1. Account Details */}
      <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
          <User className="w-4 h-4 text-[#9A7B5F]" />
          <h3 className="font-serif text-xl font-semibold text-[#18181B]">
            Account Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB]">
            <span className="text-[10px] uppercase font-bold text-[#7E6047]">Account Name</span>
            <p className="font-serif text-lg font-semibold text-[#18181B] mt-0.5">
              {user?.name || 'Gentleman'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB]">
            <span className="text-[10px] uppercase font-bold text-[#7E6047]">Registered Mobile Number</span>
            <p className="font-mono text-base font-semibold text-[#18181B] mt-0.5">
              +91 {user?.mobile_number || '••••••••••'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Privacy & Row Level Security */}
      <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="font-serif text-xl font-semibold text-[#18181B]">
            Privacy & User Isolation
          </h3>
        </div>

        <div className="space-y-2 text-xs text-[#5E4633] leading-relaxed">
          <p>
            Your wardrobe data is strictly isolated with database-level security policies (RLS). No other user or third party can view your photos, clothes, or outfit history.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE5DB] flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Private Encrypted Wardrobe Database</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE5DB] flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Bcrypt 6-Digit PIN Protection</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Wardrobe Data Controls */}
      <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
          <Database className="w-4 h-4 text-[#9A7B5F]" />
          <h3 className="font-serif text-xl font-semibold text-[#18181B]">
            Wardrobe Data Management
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleSeedWardrobe}
            className="p-4 rounded-2xl bg-[#FAF8F5] hover:bg-[#F4EFEA] border border-[#EBE5DB] text-left transition-all space-y-1"
          >
            <div className="flex items-center space-x-2 font-semibold text-xs text-[#18181B]">
              <RefreshCw className="w-4 h-4 text-[#9A7B5F]" />
              <span>Seed Classic Indian Wardrobe</span>
            </div>
            <p className="text-[11px] text-[#7E6047]">
              Add curated linen shirts, chinos, raw denim, and sneakers to your existing closet.
            </p>
          </button>

          <button
            type="button"
            onClick={handleExportData}
            className="p-4 rounded-2xl bg-[#FAF8F5] hover:bg-[#F4EFEA] border border-[#EBE5DB] text-left transition-all space-y-1"
          >
            <div className="flex items-center space-x-2 font-semibold text-xs text-[#18181B]">
              <Download className="w-4 h-4 text-[#9A7B5F]" />
              <span>Export Wardrobe Backup (JSON)</span>
            </div>
            <p className="text-[11px] text-[#7E6047]">
              Download a complete archive of your clothing tags, colors, and outfit records.
            </p>
          </button>
        </div>
      </div>

      {/* 4. Logout Button */}
      <div className="pt-4 flex justify-end">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of AUREVÉ</span>
        </button>
      </div>
    </div>
  );
}
