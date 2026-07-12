import React from 'react';
import { BusinessExpenseCategory, BusinessBudgetGroup, BusinessBudgetItem } from '../types';
import { formatCurrency } from '../utils';
import { generateId } from '../data';
import { Plus, Trash2, Edit2, Check, Target, AlertTriangle } from 'lucide-react';
import { BusinessIncomeList } from './BusinessIncomeList';
import { ConfirmModal } from './ConfirmModal';

interface BusinessExpenseListProps {
  title: string;
  categories: BusinessExpenseCategory[];
  onUpdateCategories: (categories: BusinessExpenseCategory[]) => void;
  mode?: 'plan' | 'realization';
  warningThreshold?: number;
  currency?: string;
}

export function BusinessExpenseList({ title, categories, onUpdateCategories, mode = 'plan', warningThreshold = 90, currency = 'IDR' }: BusinessExpenseListProps) {
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editTarget, setEditTarget] = React.useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const handleUpdateSubcategories = (categoryId: string, newSubcategories: BusinessBudgetGroup[]) => {
    const updatedCategories = categories.map(c => {
      if (c.id === categoryId) {
        return { ...c, subcategories: newSubcategories };
      }
      return c;
    });
    onUpdateCategories(updatedCategories);
  };

  const calculateSubtotal = (item: BusinessBudgetItem, field: 'plan' | 'realization') => {
    const price = field === 'plan' ? item.pricePlan : item.priceActual;
    return (item.quantity || 1) * price;
  };

  const calculateCategoryTotal = (category: BusinessExpenseCategory, field: 'plan' | 'realization') => {
    return (category.subcategories || []).reduce((sum, group) => {
      return sum + (group.items || []).reduce((groupSum, item) => {
        return groupSum + calculateSubtotal(item, field);
      }, 0);
    }, 0);
  };

  const handleAddCategory = () => {
    const newCategory: BusinessExpenseCategory = {
      id: generateId(),
      name: 'Kategori Pengeluaran Baru',
      targetPercentage: 10,
      subcategories: []
    };
    onUpdateCategories([...categories, newCategory]);
  };

  const executeDeleteCategory = () => {
    if (confirmDeleteId) {
      onUpdateCategories(categories.filter(c => c.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    }
  };

  const handleSaveCategoryEdit = (id: string) => {
    const updated = categories.map(c => {
      if (c.id === id) {
        return { ...c, name: editName, targetPercentage: editTarget };
      }
      return c;
    });
    onUpdateCategories(updated);
    setEditingCategoryId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={executeDeleteCategory}
        message="Apakah Anda yakin ingin menghapus kategori ini? Semua subkategori dan item di dalamnya akan ikut terhapus."
      />

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{title}</h2>
        <button
          onClick={handleAddCategory}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
        >
          <Plus size={16} />
          Tambah Kategori Besar
        </button>
      </div>

      <div className="space-y-6">
        {categories.map(category => {
          const totalPlan = calculateCategoryTotal(category, 'plan');
          const totalActual = calculateCategoryTotal(category, 'realization');
          
          return (
            <div key={category.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {editingCategoryId === category.id ? (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg px-3 py-1.5 text-sm w-full md:w-64 focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Target size={16} className="text-slate-400" />
                        <input
                          type="number"
                          value={editTarget}
                          onChange={(e) => setEditTarget(Number(e.target.value))}
                          className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg px-3 py-1.5 text-sm w-20 focus:outline-none focus:border-indigo-500 text-center"
                        />
                        <span className="text-slate-500">%</span>
                      </div>
                      <button
                        onClick={() => handleSaveCategoryEdit(category.id)}
                        className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-lg transition-colors"
                      >
                        <Check size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 group w-full md:w-auto">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{category.name}</h3>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <Target size={12} />
                        Target: {category.targetPercentage}%
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            setEditName(category.name);
                            setEditTarget(category.targetPercentage);
                          }}
                          className="text-slate-400 hover:text-indigo-600 p-1 rounded transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(category.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-sm bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-full md:w-auto">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 mr-2 text-xs uppercase tracking-wider font-semibold">Total Rencana:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{formatCurrency(totalPlan, currency)}</span>
                    </div>
                    {mode === 'realization' && (
                      <div className="pl-6 border-l border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 mr-2 text-xs uppercase tracking-wider font-semibold">Total Realisasi:</span>
                        <span className={`font-bold text-base ${totalActual > totalPlan ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {formatCurrency(totalActual, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-0">
                <BusinessIncomeList
                  title=""
                  groups={category.subcategories || []}
                  onUpdateGroups={(newSubcategories) => handleUpdateSubcategories(category.id, newSubcategories)}
                  type="expense"
                  mode={mode}
                  currency={currency}
                />
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => {
                      const newSub: BusinessBudgetGroup = { id: generateId(), name: 'Subkategori Baru', items: [] };
                      handleUpdateSubcategories(category.id, [...(category.subcategories || []), newSub]);
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    <Plus size={16} />
                    Tambah Subkategori
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
