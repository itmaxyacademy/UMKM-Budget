import React, { useState } from 'react';
import { BudgetData } from '../types';
import { CompareView } from './CompareView';
import { DebtPayoffCalculator } from './DebtPayoffCalculator';

interface MoreFeaturesProps {
  data: BudgetData;
}

export function MoreFeatures({ data }: MoreFeaturesProps) {
  const [activeFeature, setActiveFeature] = useState<'compare' | 'debt'>('compare');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
        <button
          onClick={() => setActiveFeature('compare')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeFeature === 'compare'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          Komparasi Anggaran
        </button>
        <button
          onClick={() => setActiveFeature('debt')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeFeature === 'debt'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          Kalkulator Pelunasan Hutang
        </button>
      </div>

      <div className="mt-2">
        {activeFeature === 'compare' && <CompareView data={data} />}
        {activeFeature === 'debt' && <DebtPayoffCalculator />}
      </div>
    </div>
  );
}
