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
  const [activeTab, setActiveTab] = useState<'settings' | 'credit'>('settings');
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border dark:border-slate-700">
        <div className="flex flex-col shrink-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Settings size={20} className="text-indigo-600 dark:text-indigo-400" />
              Pengaturan
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center px-6 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <button
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              onClick={() => setActiveTab('settings')}
            >
              Pengaturan
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'credit' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              onClick={() => setActiveTab('credit')}
            >
              Kredit
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {activeTab === 'settings' ? (
            <>
              <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Profil Pengguna & Bisnis</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama</label>
              <input
                type="text"
                value={data.settings?.name || ''}
                onChange={handleNameChange}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                placeholder="Masukkan nama"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Bisnis / Perusahaan</label>
              <input
                type="text"
                value={data.settings?.businessName || ''}
                onChange={(e) => onUpdateData({ ...data, settings: { ...data.settings, businessName: e.target.value } })}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                placeholder="Masukkan nama bisnis"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Profil</label>
              <select
                value={data.settings?.profile || 'single'}
                onChange={handleProfileChange}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 bg-white"
              >
                <option value="single">Single Life</option>
                <option value="married">Married Life</option>
                <option value="family">Family Life</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Peringatan Anggaran (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={data.settings?.warningThreshold ?? 90}
                  onChange={(e) => onUpdateData({ ...data, settings: { ...data.settings, warningThreshold: Number(e.target.value) } })}
                  className="w-24 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">Set 0 untuk menonaktifkan</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mata Uang</label>
              <select
                value={data.settings?.currency ?? 'IDR'}
                onChange={(e) => onUpdateData({ ...data, settings: { ...data.settings, currency: e.target.value } })}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 bg-white"
              >
                <option value="IDR">Rupiah (IDR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tema Gelap (Dark Mode)</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={data.settings?.darkMode ?? false}
                  onClick={() => onUpdateData({ ...data, settings: { ...data.settings, darkMode: !(data.settings?.darkMode ?? false) } })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                    data.settings?.darkMode ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      data.settings?.darkMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {data.settings?.darkMode ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Manajemen Template & Data</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportTemplate}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                <FileText size={16} />
                Simpan Template
              </button>
              
              <button
                onClick={() => templateInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
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
                className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 rounded-lg text-sm font-medium transition-colors"
              >
                <RotateCcw size={16} />
                Restore Default Template
              </button>

              <button
                onClick={() => exportToJson(data, 'data-becebudgeting')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={16} />
                Export Data
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium transition-colors"
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-2">
                <Settings size={32} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Kredit</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Dibuat oleh <span className="font-semibold">Andy Bintoro (Maxy Academy)</span> untuk kolaborasi bersama KTB UKM dan KBC (Kingdom Business Community).
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                Jika ingin melakukan white label atau adopsi kurikulum UKM, dapat menghubungi KBC.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
