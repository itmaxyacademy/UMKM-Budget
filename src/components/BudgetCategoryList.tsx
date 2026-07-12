import React from 'react';
import { BudgetGroup, BudgetItem } from '../types';
import { formatCurrency } from '../utils';
import { generateId } from '../data';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { CurrencyInput } from './CurrencyInput';

interface BudgetCategoryListProps {
  title: string;
  groups: BudgetGroup[];
  onUpdateGroups: (groups: BudgetGroup[]) => void;
  type: 'income' | 'expense';
  mode?: 'plan' | 'realization';
  multiplier?: number;
  currency?: string;
}

export function BudgetCategoryList({ title, groups, onUpdateGroups, type, mode = 'plan', currency = 'IDR' }: BudgetCategoryListProps) {
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [confirmDeleteGroup, setConfirmDeleteGroup] = React.useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = React.useState<{groupId: string, itemId: string} | null>(null);

  const handleUpdateItem = (groupId: string, itemId: string, field: keyof BudgetItem, value: string | number) => {
    const updatedGroups = groups.map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        items: (group.items || []).map(item => {
          if (item.id !== itemId) return item;
          return { ...item, [field]: value };
        })
      };
    });
    onUpdateGroups(updatedGroups);
  };

  const executeDeleteItem = () => {
    if (confirmDeleteItem) {
      const { groupId, itemId } = confirmDeleteItem;
      const updatedGroups = groups.map(group => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          items: (group.items || []).filter(item => item.id !== itemId)
        };
      });
      onUpdateGroups(updatedGroups);
      setConfirmDeleteItem(null);
    }
  };

  const handleDeleteItem = (groupId: string, itemId: string) => {
    setConfirmDeleteItem({ groupId, itemId });
  };

  const handleAddItem = (groupId: string) => {
    const newItem: BudgetItem = {
      id: generateId(),
      name: 'Item Baru',
      planned: 0,
      actual: 0,
      duration: 1
    };
    const updatedGroups = groups.map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        items: [...(group.items || []), newItem]
      };
    });
    onUpdateGroups(updatedGroups);
    setEditingItemId(newItem.id);
    setEditName(newItem.name);
  };

  const handleAddGroup = () => {
    const newGroup: BudgetGroup = {
      id: generateId(),
      name: 'Kategori Baru',
      items: []
    };
    onUpdateGroups([...groups, newGroup]);
  };

  const handleDeleteGroup = (groupId: string) => {
    setConfirmDeleteGroup(groupId);
  };

  const executeDeleteGroup = () => {
    if (confirmDeleteGroup) {
      onUpdateGroups(groups.filter(g => g.id !== confirmDeleteGroup));
      setConfirmDeleteGroup(null);
    }
  };

  const handleUpdateGroupName = (groupId: string, newName: string) => {
    const updatedGroups = groups.map(group => {
      if (group.id !== groupId) return group;
      return { ...group, name: newName };
    });
    onUpdateGroups(updatedGroups);
  };

  const calculateGroupTotal = (group: BudgetGroup, field: 'planned' | 'actual') => {
    return (group.items || []).reduce((sum, item) => sum + (item[field] / (item.duration || 1)), 0);
  };

  return (
    <div className={`flex flex-col ${title ? 'gap-4' : 'gap-0'}`}>
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
          <button
            onClick={handleAddGroup}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <Plus size={16} />
            Tambah Kategori
          </button>
        </div>
      )}

      <div className={title ? "space-y-6" : "space-y-0"}>
        {(groups || []).map(group => (
          <div key={group.id} className={`bg-white border-slate-200 overflow-hidden flex flex-col ${title ? 'rounded-xl border shadow-sm' : 'border-t first:border-t-0'}`}>
            {/* Group Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => handleUpdateGroupName(group.id, e.target.value)}
                  className="font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors w-full sm:w-64"
                />
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  title="Hapus Kategori"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-slate-500 mr-2 font-medium">Rencana:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(calculateGroupTotal(group, 'planned'), currency)}</span>
                </div>
                {mode === 'realization' && (
                  <div>
                    <span className="text-slate-500 mr-2 font-medium">Realisasi:</span>
                    <span className={`font-semibold ${
                      type === 'expense' && calculateGroupTotal(group, 'actual') > calculateGroupTotal(group, 'planned') 
                        ? 'text-rose-600' 
                        : 'text-slate-900'
                    }`}>
                      {formatCurrency(calculateGroupTotal(group, 'actual'), currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
                  <tr className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Item</th>
                    <th className="px-4 py-4 w-32">Durasi</th>
                    <th className="px-4 py-4 w-48">Rencana (Rp)</th>
                    {mode === 'realization' && <th className="px-4 py-4 w-48">Realisasi (Rp)</th>}
                    {mode === 'realization' && <th className="px-4 py-4 w-48">Sisa (Rp)</th>}
                    <th className="px-6 py-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {(group.items || []).map(item => {
                    const itemPlanned = item.planned;
                    const itemSisa = itemPlanned - item.actual;
                    return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        {editingItemId === item.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-indigo-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateItem(group.id, item.id, 'name', editName);
                                  setEditingItemId(null);
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                handleUpdateItem(group.id, item.id, 'name', editName);
                                setEditingItemId(null);
                              }}
                              className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-1 rounded"
                            >
                              <Check size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/item">
                            <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                            <button
                              onClick={() => {
                                setEditingItemId(item.id);
                                setEditName(item.name);
                              }}
                              className="text-slate-400 opacity-0 group-hover/item:opacity-100 hover:text-indigo-500 transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={item.duration || 1}
                          onChange={(e) => handleUpdateItem(group.id, item.id, 'duration', Number(e.target.value))}
                          className="bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:outline-none py-1 text-slate-600 dark:text-slate-300 text-sm w-full [&>option]:dark:bg-slate-800"
                        >
                          <option value={1}>Bulanan</option>
                          <option value={3}>3 Bulan</option>
                          <option value={6}>6 Bulan</option>
                          <option value={12}>Tahunan</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <CurrencyInput
                          value={itemPlanned || 0}
                          onChange={(value) => handleUpdateItem(group.id, item.id, 'planned', value)}
                          currencyCode={currency}
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200 py-1"
                          placeholder="0"
                        />
                      </td>
                      {mode === 'realization' && (
                        <td className="px-4 py-4">
                          <CurrencyInput
                            value={item.actual || 0}
                            onChange={(value) => handleUpdateItem(group.id, item.id, 'actual', value)}
                            currencyCode={currency}
                            className={`w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:outline-none py-1 ${
                              type === 'expense' && item.actual > itemPlanned ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-slate-200'
                            }`}
                            placeholder="0"
                          />
                        </td>
                      )}
                      {mode === 'realization' && (
                        <td className="px-4 py-4">
                          <span className={`font-semibold ${itemSisa < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {formatCurrency(itemSisa, currency)}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteItem(group.id, item.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                  {group.items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm italic">
                        Belum ada item di kategori ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Item Button */}
            <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => handleAddItem(group.id)}
                className="flex items-center gap-1 text-[13px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <Plus size={16} />
                Tambah Item
              </button>
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">Belum ada kategori. Silakan tambah kategori baru.</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmDeleteGroup}
        message="Yakin ingin menghapus kategori ini beserta isinya?"
        onConfirm={executeDeleteGroup}
        onCancel={() => setConfirmDeleteGroup(null)}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        message="Yakin ingin menghapus item ini?"
        onConfirm={executeDeleteItem}
        onCancel={() => setConfirmDeleteItem(null)}
      />
    </div>
  );
}
