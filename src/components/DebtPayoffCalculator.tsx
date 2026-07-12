import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils';
import { Plus, Trash2, TrendingDown } from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // annual
  minimumPayment: number;
}

interface PayoffResult {
  totalMonths: number;
  totalInterestPaid: number;
  balancesOverTime: number[];
  interestPerMonth: number[];
  principalPerMonth: number[];
}

export function DebtPayoffCalculator() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(1000000);
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  const [showCompare, setShowCompare] = useState(false);

  const addDebt = () => {
    setDebts([
      ...debts,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: 'Hutang Baru',
        balance: 10000000,
        interestRate: 10,
        minimumPayment: 500000,
      }
    ]);
  };

  const removeDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  const updateDebt = (id: string, field: keyof Debt, value: any) => {
    setDebts(debts.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const calculatePayoff = (debtsInput: Debt[], budget: number, strat: 'snowball' | 'avalanche'): PayoffResult => {
    let totalMonths = 0;
    let totalInterestPaid = 0;
    const balancesOverTime: number[] = [];
    const interestPerMonth: number[] = [];
    const principalPerMonth: number[] = [];
    
    let currentDebts = debtsInput.map(d => ({ ...d }));
    
    if (currentDebts.length === 0) return { totalMonths: 0, totalInterestPaid: 0, balancesOverTime: [], interestPerMonth: [], principalPerMonth: [] };

    const minPaymentsTotal = currentDebts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const availableExtra = Math.max(0, budget - minPaymentsTotal);

    let keepCalculating = true;
    let iteration = 0;
    
    // Initial balance
    balancesOverTime.push(currentDebts.reduce((sum, d) => sum + d.balance, 0));

    while (keepCalculating && iteration < 1200) {
      iteration++;
      
      if (strat === 'snowball') {
        currentDebts.sort((a, b) => a.balance - b.balance);
      } else {
        currentDebts.sort((a, b) => b.interestRate - a.interestRate);
      }

      let extraToAllocate = availableExtra;
      let allPaid = true;
      let monthInterest = 0;
      let monthPrincipal = 0;

      for (let i = 0; i < currentDebts.length; i++) {
        const debt = currentDebts[i];
        if (debt.balance > 0) {
          allPaid = false;
          
          const monthlyInterestRate = debt.interestRate / 100 / 12;
          const interestCharge = debt.balance * monthlyInterestRate;
          totalInterestPaid += interestCharge;
          monthInterest += interestCharge;
          debt.balance += interestCharge;

          let payment = debt.minimumPayment;
          
          if (extraToAllocate > 0) {
            payment += extraToAllocate;
            extraToAllocate = 0;
          }

          if (payment >= debt.balance) {
            extraToAllocate += (payment - debt.balance);
            monthPrincipal += (debt.balance - interestCharge);
            debt.balance = 0;
          } else {
            monthPrincipal += (payment - interestCharge);
            debt.balance -= payment;
          }
        }
      }
      
      const currentTotalBalance = currentDebts.reduce((sum, d) => sum + d.balance, 0);
      
      if (!allPaid) {
        totalMonths++;
        balancesOverTime.push(currentTotalBalance);
        interestPerMonth.push(monthInterest);
        principalPerMonth.push(monthPrincipal);
      } else {
        keepCalculating = false;
        balancesOverTime.push(0);
        interestPerMonth.push(monthInterest);
        principalPerMonth.push(monthPrincipal);
      }
    }
    
    return { totalMonths, totalInterestPaid, balancesOverTime, interestPerMonth, principalPerMonth };
  };

  const snowballResult = useMemo(() => calculatePayoff(debts, monthlyBudget, 'snowball'), [debts, monthlyBudget]);
  const avalancheResult = useMemo(() => calculatePayoff(debts, monthlyBudget, 'avalanche'), [debts, monthlyBudget]);

  const activeResult = strategy === 'snowball' ? snowballResult : avalancheResult;
  const projectionYears = Math.floor(activeResult.totalMonths / 12);
  const projectionMonths = activeResult.totalMonths % 12;
  
  const chartData = useMemo(() => {
    const maxMonths = Math.max(snowballResult.balancesOverTime.length, avalancheResult.balancesOverTime.length);
    const data = [];
    
    for (let i = 0; i < maxMonths; i++) {
      data.push({
        month: i,
        snowball: snowballResult.balancesOverTime[i] ?? 0,
        avalanche: avalancheResult.balancesOverTime[i] ?? 0,
      });
    }
    return data;
  }, [snowballResult, avalancheResult]);

  const activeChartData = useMemo(() => {
    const data = [];
    const len = activeResult.interestPerMonth.length;
    for (let i = 0; i < len; i++) {
      data.push({
        month: i + 1,
        interest: activeResult.interestPerMonth[i] || 0,
        principal: activeResult.principalPerMonth[i] || 0,
      });
    }
    return data;
  }, [activeResult]);

  const totalMinPayments = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const isFallingBehind = monthlyBudget < totalMinPayments;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
          <TrendingDown size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Debt Payoff Calculator</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Model strategi pelunasan hutang Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Anggaran Bulanan untuk Pelunasan</label>
            <CurrencyInput
              value={monthlyBudget}
              onChange={setMonthlyBudget}
              currencyCode="IDR"
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Strategi Pelunasan</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as 'snowball' | 'avalanche')}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="snowball">Debt Snowball (Bayar saldo terkecil dulu)</option>
              <option value="avalanche">Debt Avalanche (Bayar bunga terbesar dulu)</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-100 dark:border-slate-600 flex flex-col gap-3 justify-center">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Proyeksi Pelunasan ({strategy === 'snowball' ? 'Snowball' : 'Avalanche'})</h3>
          
          <div className="flex justify-between items-end">
            <span className="text-slate-600 dark:text-slate-300">Waktu Bebas Hutang:</span>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {debts.length === 0 ? '-' : activeResult.totalMonths > 0 ? `${projectionYears} thn ${projectionMonths} bln` : '0 bln'}
            </span>
          </div>
          
          <div className="flex justify-between items-end">
            <span className="text-slate-600 dark:text-slate-300">Total Bunga Dibayar:</span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {debts.length === 0 ? '-' : formatCurrency(activeResult.totalInterestPaid, 'IDR')}
            </span>
          </div>
        </div>
      </div>

      {isFallingBehind && debts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-start gap-3">
          <div className="text-amber-500 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <div>
            <h4 className="text-amber-800 dark:text-amber-400 font-bold text-sm">Peringatan Anggaran</h4>
            <p className="text-amber-700 dark:text-amber-500 text-sm mt-1">
              Anggaran bulanan Anda ({formatCurrency(monthlyBudget, 'IDR')}) lebih kecil dari total cicilan minimum ({formatCurrency(totalMinPayments, 'IDR')}). Anda berisiko tertinggal dari jadwal pelunasan, dan bunga akan terus bertambah.
            </p>
          </div>
        </div>
      )}

      {(chartData.length > 1 || activeChartData.length > 1) && (
        <div className="h-80 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {showCompare ? 'Grafik Pelunasan (Snowball vs Avalanche)' : `Breakdown Principal vs Bunga (${strategy === 'snowball' ? 'Snowball' : 'Avalanche'})`}
            </h3>
            <button
              onClick={() => setShowCompare(!showCompare)}
              className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              {showCompare ? 'Lihat Breakdown' : 'Quick Compare'}
            </button>
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            {showCompare ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSnowball" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAvalanche" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickFormatter={(val) => `Bln ${val}`} stroke="#94a3b8" fontSize={12} />
                <YAxis 
                  tickFormatter={(val) => `${val / 1000000}M`} 
                  stroke="#94a3b8" 
                  fontSize={12}
                  domain={['auto', 'auto']}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, 'IDR')}
                  labelFormatter={(label) => `Bulan ke-${label}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area 
                  type="monotone" 
                  dataKey="snowball" 
                  name="Snowball Balance" 
                  stroke="#818cf8" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSnowball)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="avalanche" 
                  name="Avalanche Balance" 
                  stroke="#34d399" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAvalanche)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={activeChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <XAxis dataKey="month" tickFormatter={(val) => `Bln ${val}`} stroke="#94a3b8" fontSize={12} />
                <YAxis 
                  tickFormatter={(val) => `${val / 1000000}M`} 
                  stroke="#94a3b8" 
                  fontSize={12}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, 'IDR')}
                  labelFormatter={(label) => `Bulan ke-${label}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="principal" name="Principal Paid" stackId="a" fill="#34d399" />
                <Bar dataKey="interest" name="Interest Paid" stackId="a" fill="#fbbf24" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Daftar Hutang</h3>
          <button
            onClick={addDebt}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <Plus size={16} />
            Tambah Hutang
          </button>
        </div>

        {debts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
            Belum ada data hutang. Klik "Tambah Hutang" untuk mulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nama Hutang</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Sisa Saldo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Bunga Tahunan (%)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Cicilan Minimum</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {debts.map(debt => (
                  <tr key={debt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={debt.name}
                        onChange={(e) => updateDebt(debt.id, 'name', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:outline-none py-1 dark:text-slate-200"
                        placeholder="Nama"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <CurrencyInput
                        value={debt.balance}
                        onChange={(val) => updateDebt(debt.id, 'balance', val)}
                        currencyCode="IDR"
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:outline-none py-1 dark:text-slate-200"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={debt.interestRate}
                        onChange={(e) => updateDebt(debt.id, 'interestRate', Number(e.target.value))}
                        className="w-24 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:outline-none py-1 dark:text-slate-200"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <CurrencyInput
                        value={debt.minimumPayment}
                        onChange={(val) => updateDebt(debt.id, 'minimumPayment', val)}
                        currencyCode="IDR"
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:outline-none py-1 dark:text-slate-200"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeDebt(debt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
