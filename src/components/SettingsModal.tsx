import React, { useRef, useState } from 'react';
import { Settings, X, Download, Upload, FileText, RotateCcw } from 'lucide-react';
import { BudgetData, ProfileType } from '../types';
import { getProfileTemplate, createDefaultBudgetData } from '../data';
import { exportToJson } from '../utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BudgetData;
  onUpdateData: (data: BudgetData) => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SettingsModal({ isOpen, onClose, data, onUpdateData, onImportData }: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateData({
      ...data,
      settings: { ...data.settings, name: e.target.value }
    });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProfile = e.target.value as ProfileType;
    if (confirm('Mengganti profil akan mereset data Anda ke template default profil tersebut. Lanjutkan?')) {
      const template = getProfileTemplate(newProfile);
      onUpdateData({
        ...template,
        settings: { ...template.settings, name: data.settings.name }
      });
    }
  };

  const handleExportTemplate = () => {
    const templateData = {
      ...data,
      incomes: data.incomes.map(g => ({ ...g, items: g.items.map(i => ({ ...i, actual: 0 })) })),
      expenses: data.expenses.map(c => ({
        ...c,
        subcategories: c.subcategories.map(g => ({ ...g, items: g.items.map(i => ({ ...i, actual: 0 })) }))
      }))
    };
    exportToJson(templateData, 'template-becebudgeting');
  };

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          if (importedData.incomes && importedData.expenses) {
            onUpdateData({
              ...data,
              incomes: importedData.incomes,
              expenses: importedData.expenses,
              settings: importedData.settings || data.settings
            });
            alert('Template berhasil diimpor!');
          }
        } catch (error) {
          alert('Format file template tidak valid.');
        }
      };
      reader.readAsText(file);
    }
    // reset
    if (templateInputRef.current) templateInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Settings size={20} className="text-indigo-600" />
            Pengaturan
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Profil Pengguna</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
              <input
                type="text"
                value={data.settings?.name || ''}
                onChange={handleNameChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                placeholder="Masukkan nama"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status Profil</label>
              <select
                value={data.settings?.profile || 'single'}
                onChange={handleProfileChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 bg-white"
              >
                <option value="single">Single Life</option>
                <option value="married">Married Life</option>
                <option value="family">Family Life</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Peringatan Anggaran (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={data.settings?.warningThreshold ?? 90}
                  onChange={(e) => onUpdateData({ ...data, settings: { ...data.settings, warningThreshold: Number(e.target.value) } })}
                  className="w-24 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-slate-500">Set 0 untuk menonaktifkan</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mata Uang</label>
              <select
                value={data.settings?.currency ?? 'IDR'}
                onChange={(e) => onUpdateData({ ...data, settings: { ...data.settings, currency: e.target.value } })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 bg-white"
              >
                <option value="IDR">Rupiah (IDR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tema Gelap (Dark Mode)</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.settings?.darkMode ?? false}
                  onChange={(e) => onUpdateData({ ...data, settings: { ...data.settings, darkMode: e.target.checked } })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">Aktifkan mode gelap</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Manajemen Template & Data</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportTemplate}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <FileText size={16} />
                Simpan Template
              </button>
              
              <button
                onClick={() => templateInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Upload size={16} />
                Muat Template File
              </button>
              <input
                type="file"
                accept=".json"
                ref={templateInputRef}
                className="hidden"
                onChange={handleImportTemplate}
              />

              <button
                onClick={() => {
                  if (confirm('Yakin ingin mereset ke template default? Ini akan mengganti budget plan Anda.')) {
                    const defaultData = createDefaultBudgetData();
                    onUpdateData({
                      ...data,
                      incomes: defaultData.incomes,
                      expenses: defaultData.expenses
                    });
                    alert('Template berhasil dikembalikan ke default!');
                  }
                }}
                className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-medium transition-colors"
              >
                <RotateCcw size={16} />
                Restore Default Template
              </button>

              <button
                onClick={() => exportToJson(data, 'data-becebudgeting')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={16} />
                Export Data
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Upload size={16} />
                Import Data
              </button>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  onImportData(e);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
