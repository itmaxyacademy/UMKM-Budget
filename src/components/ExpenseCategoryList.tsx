import React from 'react';
import { ExpenseCategory, BudgetGroup, BudgetItem } from '../types';
import { formatCurrency } from '../utils';
import { generateId } from '../data';
import { Plus, Trash2, Edit2, Check, Target, AlertTriangle } from 'lucide-react';
import { BudgetCategoryList } from './BudgetCategoryList';
import { ConfirmModal } from './ConfirmModal';

interface ExpenseCategoryListProps {
  title: string;
  categories: ExpenseCategory[];
  onUpdateCategories: (categories: ExpenseCategory[]) => void;
  mode?: 'plan' | 'realization';
  warningThreshold?: number;
  currency?: string;
}

export function ExpenseCategoryList({ title, categories, onUpdateCategories, mode = 'plan', warningThreshold = 90, currency = 'IDR' }: ExpenseCategoryListProps) {
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editTarget, setEditTarget] = React.useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  
  const handleUpdateSubcategories = (categoryId: string, newSubcategories: BudgetGroup[]) => {
    const updatedCategories = categories.map(c => {
      if (c.id === categoryId) {
        return { ...c, subcategories: newSubcategories };
      }
      return c;
    });
    onUpdateCategories(updatedCategories);
  };

  const calculateCategoryTotal = (category: ExpenseCategory, field: 'planned' | 'actual') => {
    return (category.subcategories || []).reduce((sum, sub) => {
      return sum + (sub.items || []).reduce((itemSum, item) => itemSum + (item[field] / (item.duration || 1)), 0);
    }, 0);
  };

  const calculateTotalExpenses = (field: 'planned' | 'actual') => {
    return (categories || []).reduce((sum, cat) => sum + calculateCategoryTotal(cat, field), 0);
  };

  const handleAddCategory = () => {
    const newCategory: ExpenseCategory = {
      id: generateId(),
      name: 'Kategori Baru',
      targetPercentage: 0,
      subcategories: []
    };
    onUpdateCategories([...categories, newCategory]);
  };

  const startEditing = (category: ExpenseCategory) => {
    setEditingCategoryId(category.id);
    setEditName(category.name);
    setEditTarget(category.targetPercentage);
  };

  const saveEditing = () => {
    if (editingCategoryId) {
      const updated = categories.map(c => {
        if (c.id === editingCategoryId) {
          return { ...c, name: editName, targetPercentage: editTarget };
        }
        return c;
      });
      onUpdateCategories(updated);
      setEditingCategoryId(null);
    }
  };

  const deleteCategory = (categoryId: string) => {
    setConfirmDeleteId(categoryId);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      onUpdateCategories(categories.filter(c => c.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    }
  };

  const totalExpensesPlan = calculateTotalExpenses('planned');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        {mode === 'plan' && (
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
          >
            <Plus size={16} />
            Tambah Kategori
          </button>
        )}
      </div>

      {categories.map((category) => {
        const categoryPlan = calculateCategoryTotal(category, 'planned');
        const categoryActual = calculateCategoryTotal(category, 'actual');
        const actualPercentageOfTotal = totalExpensesPlan > 0 ? (categoryPlan / totalExpensesPlan) * 100 : 0;
        const isOverTarget = actualPercentageOfTotal > category.targetPercentage;
        
        const isWarning = mode === 'realization' && warningThreshold > 0 && categoryPlan > 0 && categoryActual >= (categoryPlan * warningThreshold / 100);

        return (
          <div key={category.id} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border overflow-hidden flex flex-col mb-4 group ${isWarning ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-700'}`}>
            {/* Category Header */}
            <div className={`px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${isWarning ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center gap-3">
                {editingCategoryId === category.id && mode === 'plan' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded px-2 py-1 text-sm font-bold w-40 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="number"
                      value={editTarget}
                      onChange={(e) => setEditTarget(Number(e.target.value))}
                      className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded px-2 py-1 text-sm font-bold w-20 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">%</span>
                    <button onClick={saveEditing} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded">
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-lg ${isWarning ? 'text-amber-900 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>{category.name}</h3>
                      {isWarning && (
                        <div title={`Pengeluaran mencapai/melebihi ${warningThreshold}% dari rencana`} className="text-amber-500">
                          <AlertTriangle size={18} />
                        </div>
                      )}
                    </div>
                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <Target size={12} />
                      Target: {category.targetPercentage}%
                    </span>
                    {mode === 'plan' && (
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditing(category)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteCategory(category.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Total Rencana</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(categoryPlan, currency)}</span>
                </div>
                {mode === 'realization' && (
                  <div className="flex flex-col">
                    <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Total Realisasi</span>
                    <span className={`font-bold ${categoryActual > categoryPlan ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {formatCurrency(categoryActual, currency)}
                    </span>
                  </div>
                )}
                <div className="flex flex-col min-w-[100px]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Alokasi Aktual</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${isOverTarget ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(actualPercentageOfTotal, 100)}%` }}></div>
                    </div>
                    <span className={`font-bold text-xs ${isOverTarget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {actualPercentageOfTotal.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Render Subcategories using BudgetCategoryList component internally but just for its structure, 
                Wait, BudgetCategoryList renders its own header. 
                Instead of using BudgetCategoryList directly which has its own header and padding, we should inline the rendering or adjust BudgetCategoryList to not have headers. 
                Let's inline it to keep it clean and specific for expenses. */}
            
            <div className="p-0">
              <BudgetCategoryList currency={currency} 
                title="" 
                groups={category.subcategories}
                onUpdateGroups={(newSubgroups) => handleUpdateSubcategories(category.id, newSubgroups)}
                type="expense"
                mode={mode}
              />
            </div>

          </div>
        );
      })}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        message="Yakin ingin menghapus kategori ini?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
