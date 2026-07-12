import React, { useState } from 'react';
import { BudgetData } from '../types';
import { formatCurrency, calculateTotals } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Bookmark, Check } from 'lucide-react';

interface DashboardProps {
  data: BudgetData;
  mode?: 'plan' | 'realization';
  budgetMode?: 'personal' | 'business';
}

export function Dashboard({ data, mode = 'plan', budgetMode = 'personal' }: DashboardProps) {
  const [recurringToggle, setRecurringToggle] = useState<'month' | 'year'>('month');

  const totals = calculateTotals(data, mode, budgetMode);
  const colRatio = totals.income > 0 ? (totals.expenses / totals.income) * 100 : 0;
  const surplusRatio = totals.income > 0 ? (Math.max(0, totals.surplus) / totals.income) * 100 : (totals.surplus > 0 ? 100 : 0);

  const currentMonth = data.settings.realizationMonth || new Date().getMonth() + 1;
  const currentYear = data.settings.realizationYear || new Date().getFullYear();
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  
  const prevHistory = data.history?.find(h => h.month === prevMonth && h.year === prevYear);

  const incomeDiff = prevHistory ? totals.income - prevHistory.income : null;
  const expenseDiff = prevHistory ? totals.expenses - prevHistory.expense : null;

  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4'];

  const categories = Object.entries(totals.categoryTotals).map(([name, { total, targetPercentage }], idx) => ({
    name,
    value: total,
    targetPercentage,
    color: COLORS[idx % COLORS.length]
  }));

  const chartData = [
    { name: 'COL', value: totals.expenses, color: '#e2e8f0' }, // using a gauge style for the donut
  ];
  
  // Custom radial bar or simple pie for the gauge
  const gaugeData = [
    { name: 'COL', value: colRatio, color: '#cbd5e1' },
    { name: 'Remaining', value: Math.max(0, 100 - colRatio), color: '#f1f5f9' }
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-sm mx-auto font-sans">
      
      {/* SUMMARY SECTION */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-100"></div>
          <h2 className="text-lg font-extrabold tracking-widest text-slate-900 dark:text-slate-100">SUMMARY</h2>
        </div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-6">
          {data.settings.profile.replace('_', ' ')} LIFE
        </p>

        {/* DONUT CHART */}
        <div className="relative h-64 w-full flex items-center justify-center mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="transparent"
                strokeWidth={2}
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest">COL / INCOME</span>
            <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{Math.round(colRatio)}%</span>
          </div>
        </div>

        {/* CATEGORY LIST */}
        <div className="flex flex-col gap-3 mb-8">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 uppercase">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <span>{cat.name}</span>
              </div>
              <span>{totals.income > 0 ? Math.round((cat.value / totals.income) * 100) : 0}%</span>
            </div>
          ))}
          <div className="h-px bg-slate-100 my-1"></div>
          <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
            <div className="flex items-center gap-2 uppercase">
              <div className="w-2 h-2 rounded-full border border-emerald-600 opacity-50"></div>
              <span>SURPLUS</span>
            </div>
            <span>{Math.round(surplusRatio)}%</span>
          </div>
        </div>

        {/* TOTALS */}
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-1">
              {budgetMode === 'business' ? 'TOTAL LABA KOTOR' : 'TOTAL MONTHLY INCOME'}
            </h3>
            <p className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {formatCurrency(budgetMode === 'business' ? totals.grossProfit : totals.income, data.settings.currency)}
            </p>
            {mode === 'realization' && incomeDiff !== null && (
              <p className={`text-xs font-semibold mt-1 ${incomeDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {incomeDiff >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(incomeDiff), data.settings.currency)} dari bulan lalu
              </p>
            )}
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-1">
              {budgetMode === 'business' ? 'TOTAL PENGELUARAN' : 'COST OF LIVING (COL)'}
            </h3>
            <p className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {formatCurrency(budgetMode === 'business' ? totals.operatingExpenses : totals.expenses, data.settings.currency)}
            </p>
            {mode === 'realization' && expenseDiff !== null && (
              <p className={`text-xs font-semibold mt-1 ${expenseDiff <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {expenseDiff <= 0 ? '▼' : '▲'} {formatCurrency(Math.abs(expenseDiff), data.settings.currency)} dari bulan lalu
              </p>
            )}
          </div>
        </div>

        {/* SURPLUS BOX */}
        <div className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center ${totals.surplus >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-700' : 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 dark:border-rose-700'}`}>
          <div className={`flex items-center gap-2 text-sm font-extrabold tracking-widest mb-2 uppercase ${totals.surplus >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            <Check size={16} strokeWidth={3} />
            <span>{totals.surplus >= 0 ? (budgetMode === 'business' ? 'PROFIT' : 'SURPLUS') : (budgetMode === 'business' ? 'RUGI' : 'DEFICIT')}</span>
          </div>
          <p className={`text-4xl font-extrabold tracking-tight ${totals.surplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(Math.abs(totals.surplus), data.settings.currency)}
          </p>
        </div>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>

      {/* RECURRING COST */}
      {budgetMode !== 'business' && (
        <>
          <div className="bg-teal-50 dark:bg-teal-900/30 border-2 border-teal-400 dark:border-teal-700 rounded-3xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-extrabold tracking-widest text-sm uppercase">
                <Bookmark size={18} strokeWidth={3} />
                <span>RECURRING COST</span>
              </div>
              <div className="flex bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-teal-100 dark:border-teal-800">
                <button
                  onClick={() => setRecurringToggle('month')}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-colors ${recurringToggle === 'month' ? 'bg-teal-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  PER BULAN
                </button>
                <button
                  onClick={() => setRecurringToggle('year')}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-colors ${recurringToggle === 'year' ? 'bg-teal-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  PER TAHUN
                </button>
              </div>
            </div>
            
            <p className="text-4xl font-extrabold text-teal-800 dark:text-teal-400 tracking-tight mb-2">
              {formatCurrency(recurringToggle === 'month' ? totals.recurringCostMonth : totals.recurringCostYear, data.settings.currency)}
            </p>
            <p className="text-sm font-medium text-teal-600 dark:text-teal-500 italic">
              Set aside this much each {recurringToggle === 'month' ? 'month' : 'year'} for non-monthly bills
            </p>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
        </>
      )}

      {/* STRATEGY ALIGNMENT */}
      <div className="flex flex-col mb-8">
        <h2 className="text-sm font-extrabold tracking-widest text-slate-400 mb-6">STRATEGY ALIGNMENT</h2>
        
        <div className="flex flex-col gap-6">
          {categories.map((cat, idx) => {
            const actualPercent = totals.income > 0 ? (cat.value / totals.income) * 100 : 0;
            return (
              <div key={idx} className="flex flex-col">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-extrabold text-slate-700 uppercase">{cat.name} ({cat.targetPercentage}%)</span>
                  <span className="text-sm font-extrabold" style={{ color: cat.color }}>{Math.round(actualPercent)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(actualPercent, 100)}%`, backgroundColor: cat.color }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-200 my-2"></div>

      {/* TREND CHART */}
      <div className="flex flex-col mb-8">
        <h2 className="text-sm font-extrabold tracking-widest text-slate-400 mb-6 uppercase">Trend Keuangan</h2>
        {data.history && data.history.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.history.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(val) => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return months[val - 1] || val;
                  }}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={(val) => `${val / 1000}k`}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, data.settings.currency)}
                  labelFormatter={(label) => `Bulan ${label}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="income" name="Pendapatan" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            <span className="text-sm font-medium text-slate-400">Belum ada data historis realisasi.</span>
          </div>
        )}
      </div>

    </div>
  );
}

