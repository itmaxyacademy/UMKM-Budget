/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BudgetData } from './types';
import { defaultBudgetData, getProfileTemplate, generateId } from './data';
import { Dashboard } from './components/Dashboard';
import { BudgetCategoryList } from './components/BudgetCategoryList';
import { ExpenseCategoryList } from './components/ExpenseCategoryList';
import { BusinessIncomeList } from './components/BusinessIncomeList';
import { BusinessExpenseList } from './components/BusinessExpenseList';
import { SettingsModal } from './components/SettingsModal';
import { exportToJson, exportToPdf, exportToCsv, exportToXls } from './utils';
import { FileText, Calculator, Settings, Save, Upload, WifiOff } from 'lucide-react';

import { MoreFeatures } from './components/MoreFeatures';
import { OnboardingModal } from './components/OnboardingModal';
import { usePWA } from './usePWA';

export default function App() {
  const { isOnline } = usePWA();
  const [data, setData] = useState<BudgetData>(() => {
    const saved = localStorage.getItem('budget_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.settings) parsed.settings = defaultBudgetData.settings;
        
        // validate data format to prevent errors from old data
        if (parsed.expenses && parsed.expenses.length > 0 && !parsed.expenses[0].subcategories) {
          console.warn('Old data format detected. Resetting to default.');
          return defaultBudgetData;
        }

        return parsed;
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return defaultBudgetData;
  });

  const [activeTab, setActiveTab] = useState<'plan' | 'realization' | 'more'>('plan');
  const [budgetMode, setBudgetMode] = useState<'personal' | 'business'>('personal');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('budget_data_onboarded'));

  const reportRef = useRef<HTMLDivElement>(null);
  const realizationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('budget_data', JSON.stringify(data));
  }, [data]);

  const handleOnboardingComplete = (name: string, profile: 'single' | 'married' | 'family') => {
    // Generate new template based on profile
    const templateData = getProfileTemplate(profile);
    setData({
      ...templateData,
      settings: {
        ...templateData.settings,
        name: name,
        profile: profile,
      }
    });
    localStorage.setItem('budget_data_onboarded', 'true');
    setShowOnboarding(false);
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.incomes && importedData.expenses) {
          setData({
            ...importedData,
            settings: importedData.settings || data.settings
          });
          alert('Data berhasil diimpor!');
        } else {
          alert('Format data tidak valid.');
        }
      } catch (error) {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
    // clear input
    if (realizationInputRef.current) realizationInputRef.current.value = '';
  };

  const handleSaveRealization = () => {
    const month = data.settings.realizationMonth || new Date().getMonth() + 1;
    const year = data.settings.realizationYear || new Date().getFullYear();
    
    // Calculate current realization totals
    let currentIncome = 0;
    data.incomes.forEach((group) => {
      group.items.forEach((item) => {
        currentIncome += item.actual / (item.duration || 1);
      });
    });

    let currentExpense = 0;
    data.expenses.forEach((category) => {
      category.subcategories.forEach((group) => {
        group.items.forEach((item) => {
          currentExpense += item.actual / (item.duration || 1);
        });
      });
    });

    const newHistoryEntry = {
      id: generateId(),
      month,
      year,
      income: currentIncome,
      expense: currentExpense
    };

    const updatedHistory = [...(data.history || []).filter(h => h.month !== month || h.year !== year), newHistoryEntry];
    
    setData(prev => ({
      ...prev,
      history: updatedHistory
    }));

    exportToJson(data, `realisasi-${month}-${year}`);
    alert('Realisasi berhasil disimpan ke riwayat dan diunduh!');
  };

  const handleAddBusinessProduct = () => {
    const newProductId = generateId();
    const newHppId = generateId();
    const newGroupId = generateId();
    
    const newItem = {
      id: newProductId,
      name: 'Penjualan - Barang Baru',
      quantity: 1,
      pricePlan: 0,
      priceActual: 0,
      duration: 1,
      linkedId: newHppId
    };

    const newHppItem = {
      id: newHppId,
      name: 'HPP - Barang Baru',
      quantity: 1,
      pricePlan: 0,
      priceActual: 0,
      duration: 1,
      isHPP: true,
      linkedId: newProductId
    };

    const newGroup = {
      id: newGroupId,
      name: 'Barang Baru',
      items: [newItem, newHppItem]
    };

    const updatedIncomes = [...(data.businessIncomes || []), newGroup];

    setData({ ...data, businessIncomes: updatedIncomes });
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans flex flex-col ${data.settings?.darkMode ? 'dark' : ''}`}>
      <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        data={data}
        onUpdateData={setData}
        onImportData={handleImportJson}
      />
      {/* Navbar */}
      <header className="print:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shrink-0">
        <div className="max-w-7xl w-full mx-auto px-4 md:px-6 h-auto md:h-16 py-3 md:py-0 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Calculator size={20} className="text-white" />
              </div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">UMKM Budget <span className="text-indigo-600 font-medium">Pro</span></h1>
              {!isOnline && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                  <WifiOff size={12} />
                  Offline
                </span>
              )}
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Pengaturan"
            >
              <Settings size={18} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600 w-full md:w-auto">
              <button 
                onClick={() => setBudgetMode('personal')}
                className={`flex-1 md:flex-none px-2 md:px-3 py-1.5 text-xs font-semibold rounded ${budgetMode === 'personal' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Pribadi
              </button>
              <button 
                onClick={() => setBudgetMode('business')}
                className={`flex-1 md:flex-none px-2 md:px-3 py-1.5 text-xs font-semibold rounded ${budgetMode === 'business' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Bisnis
              </button>
            </div>

            <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600 w-full md:w-auto">
              <button 
                onClick={() => setActiveTab('plan')}
                className={`flex-1 md:flex-none px-2 md:px-3 py-1.5 text-xs font-semibold rounded ${activeTab === 'plan' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Plan
              </button>
              <button 
                onClick={() => setActiveTab('realization')}
                className={`flex-1 md:flex-none px-2 md:px-3 py-1.5 text-xs font-semibold rounded ${activeTab === 'realization' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Realisasi
              </button>
              <button 
                onClick={() => setActiveTab('more')}
                className={`flex-1 md:flex-none px-2 md:px-3 py-1.5 text-xs font-semibold rounded ${activeTab === 'more' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Lainnya
              </button>
            </div>
            
            <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm shrink-0"
              title="Pengaturan"
            >
              <Settings size={16} />
              <span>Pengaturan</span>
            </button>

            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  const menu = document.getElementById('export-menu-desktop');
                  menu?.classList.toggle('hidden');
                }}
                onBlur={() => {
                  setTimeout(() => {
                    const menu = document.getElementById('export-menu-desktop');
                    menu?.classList.add('hidden');
                  }, 200);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
                title="Export Laporan"
              >
                <FileText size={16} />
                <span>Download Report</span>
              </button>
              <div id="export-menu-desktop" className="hidden absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                <div className="py-1">
                  <button onClick={() => exportToPdf(data, activeTab === 'realization' ? 'realization' : 'plan', budgetMode)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">PDF</button>
                  <button onClick={() => exportToCsv(data, activeTab === 'realization' ? 'realization' : 'plan', budgetMode)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">CSV</button>
                  <button onClick={() => exportToXls(data, activeTab === 'realization' ? 'realization' : 'plan', budgetMode)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">XLSX</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="print:hidden md:hidden sticky top-[102px] z-10 w-full px-4 py-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
         <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Aksi Laporan:</span>
         <div className="relative">
           <button
              onClick={() => {
                const menu = document.getElementById('export-menu-mobile');
                menu?.classList.toggle('hidden');
              }}
              onBlur={() => {
                setTimeout(() => {
                  const menu = document.getElementById('export-menu-mobile');
                  menu?.classList.add('hidden');
                }, 200);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
              title="Export Laporan"
            >
              <FileText size={14} />
              <span>Download</span>
           </button>
           <div id="export-menu-mobile" className="hidden absolute right-0 mt-2 w-28 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
              <div className="py-1">
                <button onClick={() => exportToPdf(data, activeTab === 'realization' ? 'realization' : 'plan', budgetMode)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">PDF</button>
                <button onClick={() => exportToCsv(data, activeTab === 'realization' ? 'realization' : 'plan', budgetMode)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">CSV</button>
                <button onClick={() => exportToXls(data, activeTab === 'realization' ? 'realization' : 'plan', budgetMode)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">XLSX</button>
              </div>
           </div>
         </div>
      </div>

      {/* Main Content */}
      <main id="main-report" className="flex-1 w-full max-w-7xl mx-auto p-6 flex flex-col gap-6">
        {data.settings?.name && (
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Halo, {data.settings.name} 👋
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Selamat datang kembali di dashboard perencanaan keuangan UMKM Anda.</p>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 flex flex-col gap-6 w-full">
                {budgetMode === 'personal' ? (
                  <>
                    <BudgetCategoryList currency={data.settings.currency}
                      title="Pendapatan (Income)"
                      type="income"
                      mode="plan"
                      groups={data.incomes}
                      onUpdateGroups={(newGroups) => setData({ ...data, incomes: newGroups })}
                    />
    
                    <ExpenseCategoryList currency={data.settings.currency}
                      title="Pengeluaran (Expenses)"
                      mode="plan"
                      categories={data.expenses}
                      onUpdateCategories={(newCategories) => setData({ ...data, expenses: newCategories })}
                    />
                  </>
                ) : (
                  <>
                    <BusinessIncomeList currency={data.settings.currency}
                      title="Pendapatan Usaha (Revenue)"
                      type="income"
                      mode="plan"
                      groups={data.businessIncomes || []}
                      onUpdateGroups={(newGroups) => setData({ ...data, businessIncomes: newGroups })}
                      onAddProduct={handleAddBusinessProduct}
                    />
    
                    <BusinessExpenseList currency={data.settings.currency}
                      title="Pengeluaran Usaha (Expenses)"
                      mode="plan"
                      categories={data.businessExpenses || []}
                      onUpdateCategories={(newCategories) => setData({ ...data, businessExpenses: newCategories })}
                    />
                  </>
                )}
              </div>
              <div className="lg:col-span-4 w-full bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                <Dashboard data={data} mode="plan" budgetMode={budgetMode} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'realization' && (
          <div ref={reportRef} className="bg-transparent print:bg-white flex-1 flex flex-col gap-6">
            <div className="print:hidden shrink-0 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:inline">Periode Realisasi:</span>
                <select
                  value={data.settings.realizationMonth || new Date().getMonth() + 1}
                  onChange={(e) => setData({ ...data, settings: { ...data.settings, realizationMonth: Number(e.target.value) } })}
                  className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 md:px-4 py-2 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>Januari</option>
                  <option value={2}>Februari</option>
                  <option value={3}>Maret</option>
                  <option value={4}>April</option>
                  <option value={5}>Mei</option>
                  <option value={6}>Juni</option>
                  <option value={7}>Juli</option>
                  <option value={8}>Agustus</option>
                  <option value={9}>September</option>
                  <option value={10}>Oktober</option>
                  <option value={11}>November</option>
                  <option value={12}>Desember</option>
                </select>
                <input
                  type="number"
                  value={data.settings.realizationYear || new Date().getFullYear()}
                  onChange={(e) => setData({ ...data, settings: { ...data.settings, realizationYear: Number(e.target.value) } })}
                  className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 md:px-4 py-2 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 w-20 md:w-24"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={handleSaveRealization}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-transparent rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-sm"
                >
                  <Save size={16} />
                  <span>Simpan</span>
                </button>
                <button
                  onClick={() => realizationInputRef.current?.click()}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
                >
                  <Upload size={16} />
                  <span>Muat</span>
                </button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  ref={realizationInputRef}
                  onChange={handleImportJson}
                />
              </div>
            </div>
            
            <div className="hidden print:block mb-8 shrink-0">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Laporan Realisasi Anggaran</h2>
              <p className="text-slate-500">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 flex flex-col gap-6 w-full">
                {budgetMode === 'personal' ? (
                  <>
                    <BudgetCategoryList currency={data.settings.currency}
                      title="Pendapatan (Income)"
                      type="income"
                      mode="realization"
                      groups={data.incomes}
                      onUpdateGroups={(newGroups) => setData({ ...data, incomes: newGroups })}
                    />
    
                    <ExpenseCategoryList currency={data.settings.currency}
                      title="Pengeluaran (Expenses)"
                      mode="realization"
                      categories={data.expenses}
                      warningThreshold={data.settings.warningThreshold}
                      onUpdateCategories={(newCategories) => setData({ ...data, expenses: newCategories })}
                    />
                  </>
                ) : (
                  <>
                    <BusinessIncomeList currency={data.settings.currency}
                      title="Pendapatan Usaha (Revenue)"
                      type="income"
                      mode="realization"
                      groups={data.businessIncomes || []}
                      onUpdateGroups={(newGroups) => setData({ ...data, businessIncomes: newGroups })}
                      onAddProduct={handleAddBusinessProduct}
                    />
    
                    <BusinessExpenseList currency={data.settings.currency}
                      title="Pengeluaran Usaha (Expenses)"
                      mode="realization"
                      categories={data.businessExpenses || []}
                      warningThreshold={data.settings.warningThreshold}
                      onUpdateCategories={(newCategories) => setData({ ...data, businessExpenses: newCategories })}
                    />
                  </>
                )}
              </div>
              <div className="lg:col-span-4 w-full bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                <Dashboard data={data} mode="realization" budgetMode={budgetMode} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'more' && (
          <MoreFeatures data={data} />
        )}
      </main>
    </div>
  );
}

