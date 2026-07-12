import React, { useState } from 'react';
import { BudgetData, RealizationHistory } from '../types';
import { formatCurrency } from '../utils';

export function CompareView({ data }: { data: BudgetData }) {
  const history = data.history || [];
  
  const [month1Id, setMonth1Id] = useState<string>(history.length > 0 ? history[history.length - 1].id : '');
  const [month2Id, setMonth2Id] = useState<string>(history.length > 1 ? history[history.length - 2].id : '');

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Belum ada data realisasi</h2>
        <p className="text-slate-500">Silakan simpan data realisasi terlebih dahulu di tab Realisasi.</p>
      </div>
    );
  }

  const m1 = history.find(h => h.id === month1Id);
  const m2 = history.find(h => h.id === month2Id);

  const renderMonthOptions = () => {
    return history.map(h => (
      <option key={h.id} value={h.id}>
        Bulan {h.month} - {h.year}
      </option>
    ));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Bulan A:</span>
          <select
            value={month1Id}
            onChange={(e) => setMonth1Id(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            {renderMonthOptions()}
          </select>
        </div>
        
        <span className="text-slate-400 font-bold hidden md:inline">VS</span>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Bulan B:</span>
          <select
            value={month2Id}
            onChange={(e) => setMonth2Id(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Pilih Bulan</option>
            {renderMonthOptions()}
          </select>
        </div>
      </div>

      {m1 && m2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Bulan A ({m1.month}-{m1.year})</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-sm font-bold text-emerald-800 uppercase">Pendapatan</span>
                <span className="text-xl font-extrabold text-emerald-600">{formatCurrency(m1.income, data.settings.currency)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-rose-50 rounded-xl border border-rose-100">
                <span className="text-sm font-bold text-rose-800 uppercase">Pengeluaran</span>
                <span className="text-xl font-extrabold text-rose-600">{formatCurrency(m1.expense, data.settings.currency)}</span>
              </div>
              <div className={`flex justify-between items-center p-4 rounded-xl border ${m1.income - m1.expense >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-sm font-bold text-slate-700 uppercase">Surplus / Defisit</span>
                <span className={`text-xl font-extrabold ${m1.income - m1.expense >= 0 ? 'text-indigo-600' : 'text-slate-600'}`}>{formatCurrency(Math.abs(m1.income - m1.expense), data.settings.currency)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Bulan B ({m2.month}-{m2.year})</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100 relative overflow-hidden">
                <span className="text-sm font-bold text-emerald-800 uppercase">Pendapatan</span>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-extrabold text-emerald-600">{formatCurrency(m2.income, data.settings.currency)}</span>
                  <span className={`text-xs font-bold mt-1 ${m2.income - m1.income >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {m2.income - m1.income >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(m2.income - m1.income), data.settings.currency)} vs Bulan A
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-rose-50 rounded-xl border border-rose-100">
                <span className="text-sm font-bold text-rose-800 uppercase">Pengeluaran</span>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-extrabold text-rose-600">{formatCurrency(m2.expense, data.settings.currency)}</span>
                  <span className={`text-xs font-bold mt-1 ${m2.expense - m1.expense <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {m2.expense - m1.expense <= 0 ? '▼' : '▲'} {formatCurrency(Math.abs(m2.expense - m1.expense), data.settings.currency)} vs Bulan A
                  </span>
                </div>
              </div>
              <div className={`flex justify-between items-center p-4 rounded-xl border ${m2.income - m2.expense >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-sm font-bold text-slate-700 uppercase">Surplus / Defisit</span>
                <div className="flex flex-col items-end">
                  <span className={`text-xl font-extrabold ${m2.income - m2.expense >= 0 ? 'text-indigo-600' : 'text-slate-600'}`}>{formatCurrency(Math.abs(m2.income - m2.expense), data.settings.currency)}</span>
                  <span className={`text-xs font-bold mt-1 ${(m2.income - m2.expense) - (m1.income - m1.expense) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(m2.income - m2.expense) - (m1.income - m1.expense) >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs((m2.income - m2.expense) - (m1.income - m1.expense)), data.settings.currency)} vs Bulan A
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
