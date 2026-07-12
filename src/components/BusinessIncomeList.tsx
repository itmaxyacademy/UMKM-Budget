import React from 'react';
import { BusinessBudgetGroup, BusinessBudgetItem } from '../types';
import { formatCurrency } from '../utils';
import { generateId } from '../data';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { CurrencyInput } from './CurrencyInput';

interface BusinessIncomeListProps {
  title: string;
  groups: BusinessBudgetGroup[];
  onUpdateGroups: (groups: BusinessBudgetGroup[]) => void;
  onAddProduct?: () => void;
  type: 'income' | 'expense';
  mode?: 'plan' | 'realization';
  currency?: string;
}

export function BusinessIncomeList({ title, groups, onUpdateGroups, onAddProduct, type, mode = 'plan', currency = 'IDR' }: BusinessIncomeListProps) {
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [confirmDeleteGroup, setConfirmDeleteGroup] = React.useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = React.useState<{groupId: string, itemId: string} | null>(null);

  const handleUpdateItem = (groupId: string, itemId: string, field: keyof BusinessBudgetItem, value: string | number | boolean) => {
    const updatedGroups = groups.map(group => {
      if (group.id !== groupId) return group;
      
      const sourceItem = (group.items || []).find(i => i.id === itemId);
      
      return {
        ...group,
        items: (group.items || []).map(item => {
          if (item.id === itemId) return { ...item, [field]: value };
          if (field === 'quantity' && sourceItem && sourceItem.linkedId === item.id) {
            return { ...item, quantity: value as number };
          }
          if (field === 'quantityActual' && sourceItem && sourceItem.linkedId === item.id) {
            return { ...item, quantityActual: value as number };
          }
          return item;
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

  const executeDeleteGroup = () => {
    if (confirmDeleteGroup) {
      onUpdateGroups(groups.filter(g => g.id !== confirmDeleteGroup));
      setConfirmDeleteGroup(null);
    }
  };

  const handleAddItem = (groupId: string) => {
    if (onAddProduct) {
      onAddProduct();
      return;
    }
    const newItem: BusinessBudgetItem = {
      id: generateId(),
      name: 'Item Baru',
      quantity: 1,
      pricePlan: 0,
      priceActual: 0,
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
    onUpdateGroups([...groups, { id: generateId(), name: 'Kategori Baru', items: [] }]);
  };

  const calculateSubtotal = (item: BusinessBudgetItem, field: 'plan' | 'realization') => {
    const price = field === 'plan' ? item.pricePlan : item.priceActual;
    const qty = field === 'plan' ? (item.quantity || 0) : (item.quantityActual ?? item.quantity ?? 0);
    return qty * price;
  };

  const calculateGroupTotal = (group: BusinessBudgetGroup, field: 'plan' | 'realization') => {
    return (group.items || []).reduce((sum, item) => {
      const subtotal = calculateSubtotal(item, field);
      return item.isHPP ? sum - subtotal : sum + subtotal;
    }, 0);
  };

  return (
    <div className={`flex flex-col ${title ? 'gap-4' : 'gap-0'}`}>
      <ConfirmModal
        isOpen={!!confirmDeleteGroup}
        onCancel={() => setConfirmDeleteGroup(null)}
        onConfirm={executeDeleteGroup}
        message="Apakah Anda yakin ingin menghapus kategori ini? Semua item di dalamnya akan ikut terhapus."
      />
      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onCancel={() => setConfirmDeleteItem(null)}
        onConfirm={executeDeleteItem}
        message="Apakah Anda yakin ingin menghapus item ini?"
      />

      {title && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{title}</h2>
          {type === 'income' ? (
            <button
              onClick={() => onAddProduct?.()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              <Plus size={16} />
              Tambah Barang/Jasa
            </button>
          ) : (
            <button
              onClick={handleAddGroup}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
            >
              <Plus size={16} />
              Tambah Kategori
            </button>
          )}
        </div>
      )}

      <div className={title ? "space-y-6" : "space-y-0"}>
        {(groups || []).map(group => (
          <div key={group.id} className={`bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col ${title ? 'rounded-xl border shadow-sm' : 'border-t first:border-t-0'}`}>
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const updatedGroups = groups.map(g => {
                      if (g.id !== group.id) return g;
                      return { 
                        ...g, 
                        name,
                        items: type === 'income' 
                          ? (g.items || []).map(item => ({
                              ...item,
                              name: item.isHPP ? `HPP - ${name}` : `Penjualan - ${name}`
                            }))
                          : g.items
                      };
                    });
                    onUpdateGroups(updatedGroups);
                  }}
                  className="font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors w-full sm:w-64"
                />
                <button
                  onClick={() => setConfirmDeleteGroup(group.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 mr-2 font-medium">{type === 'income' ? 'Laba Kotor (Rencana):' : 'Rencana:'}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(calculateGroupTotal(group, 'plan'), currency)}</span>
                </div>
                {mode === 'realization' && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 mr-2 font-medium">{type === 'income' ? 'Laba Kotor (Realisasi):' : 'Realisasi:'}</span>
                    <span className={`font-semibold ${
                      type === 'expense' && calculateGroupTotal(group, 'realization') > calculateGroupTotal(group, 'plan') 
                        ? 'text-rose-600 dark:text-rose-400' 
                        : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {formatCurrency(calculateGroupTotal(group, 'realization'), currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-0 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead>
                  <tr className="bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider">
                    <th className="font-semibold py-3 px-6" rowSpan={mode === 'realization' ? 2 : 1}>Item</th>
                    {mode === 'realization' ? (
                      <>
                        <th className="font-semibold py-2 px-6 text-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80" colSpan={3}>Plan</th>
                        <th className="font-semibold py-2 px-6 text-center border-b border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20" colSpan={3}>Realization</th>
                      </>
                    ) : (
                      <>
                        <th className="font-semibold py-3 px-6 w-[15%]">Kuantitas</th>
                        <th className="font-semibold py-3 px-6 w-[20%]">Harga</th>
                        <th className="font-semibold py-3 px-6 w-[20%] text-right">Subtotal</th>
                      </>
                    )}
                    <th className="font-semibold py-3 px-6 text-right" rowSpan={mode === 'realization' ? 2 : 1}></th>
                  </tr>
                  {mode === 'realization' && (
                    <tr className="bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider">
                      <th className="font-semibold py-2 px-6 bg-slate-50 dark:bg-slate-800/80">Kuantitas</th>
                      <th className="font-semibold py-2 px-6 bg-slate-50 dark:bg-slate-800/80">Harga</th>
                      <th className="font-semibold py-2 px-6 text-right bg-slate-50 dark:bg-slate-800/80">Subtotal</th>
                      <th className="font-semibold py-2 px-6 bg-indigo-50 dark:bg-indigo-900/20">Kuantitas</th>
                      <th className="font-semibold py-2 px-6 bg-indigo-50 dark:bg-indigo-900/20">Harga</th>
                      <th className="font-semibold py-2 px-6 text-right bg-indigo-50 dark:bg-indigo-900/20">Subtotal</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {(group.items || []).map((item) => {
                    const itemSubtotalPlan = calculateSubtotal(item, 'plan');
                    const itemSubtotalActual = calculateSubtotal(item, 'realization');

                    return (
                      <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            {editingItemId === item.id ? (
                              <div className="flex items-center gap-2 w-full">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:border-indigo-500"
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
                                  className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"
                                >
                                  <Check size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 w-full group/name">
                                <span className={`font-medium text-slate-700 dark:text-slate-200 ${item.isHPP ? 'text-rose-600 dark:text-rose-400 italic' : ''}`}>{item.name}</span>
                                {type !== 'income' && (
                                  <button
                                    onClick={() => {
                                      setEditingItemId(item.id);
                                      setEditName(item.name);
                                    }}
                                    className="text-slate-300 hover:text-indigo-600 opacity-0 group-hover/name:opacity-100 transition-opacity"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {mode === 'plan' ? (
                          <>
                            <td className="py-3 px-6">
                               <input
                                  type="number"
                                  min="1"
                                  value={item.quantity === 0 ? '' : item.quantity}
                                  onChange={(e) => handleUpdateItem(group.id, item.id, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                  onBlur={(e) => {
                                    if (!item.quantity || item.quantity <= 0) {
                                      handleUpdateItem(group.id, item.id, 'quantity', 1);
                                    }
                                  }}
                                  disabled={item.isHPP}
                                  className={`w-full border border-transparent rounded px-2 py-1 text-sm bg-transparent dark:text-white transition-colors ${item.isHPP ? 'text-slate-400 cursor-not-allowed' : 'hover:border-slate-300 focus:border-indigo-500 dark:hover:border-slate-600'}`}
                                />
                            </td>
                            <td className="py-3 px-6">
                              <CurrencyInput
                                value={item.pricePlan || 0}
                                onChange={(value) => handleUpdateItem(group.id, item.id, 'pricePlan', value)}
                                currencyCode={currency}
                                className="w-full border border-transparent hover:border-slate-300 focus:border-indigo-500 dark:hover:border-slate-600 rounded px-2 py-1 text-sm bg-transparent dark:text-white transition-colors"
                              />
                            </td>
                            <td className="py-3 px-6 text-right">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {formatCurrency(itemSubtotalPlan, currency)}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-6 bg-slate-50/30 dark:bg-slate-800/30 border-l border-slate-100 dark:border-slate-700/50">
                              <span className="text-sm text-slate-600 dark:text-slate-400">{item.quantity}</span>
                            </td>
                            <td className="py-3 px-6 bg-slate-50/30 dark:bg-slate-800/30">
                              <span className="text-sm text-slate-600 dark:text-slate-400">{formatCurrency(item.pricePlan, currency)}</span>
                            </td>
                            <td className="py-3 px-6 text-right bg-slate-50/30 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-700/50">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{formatCurrency(itemSubtotalPlan, currency)}</span>
                            </td>
                            
                            <td className="py-3 px-6 bg-indigo-50/10 dark:bg-indigo-900/10">
                              <input
                                  type="number"
                                  min="0"
                                  value={item.quantityActual === undefined ? (item.quantity === 0 ? '' : item.quantity) : (item.quantityActual === 0 ? '' : item.quantityActual)}
                                  onChange={(e) => handleUpdateItem(group.id, item.id, 'quantityActual', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                  onBlur={(e) => {
                                    if (item.quantityActual === undefined || item.quantityActual < 0) {
                                      handleUpdateItem(group.id, item.id, 'quantityActual', item.quantity || 0);
                                    }
                                  }}
                                  disabled={item.isHPP}
                                  className={`w-full border border-slate-200 dark:border-slate-600 focus:border-indigo-500 rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 dark:text-white transition-colors shadow-sm ${item.isHPP ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
                            </td>
                            <td className="py-3 px-6 bg-indigo-50/10 dark:bg-indigo-900/10">
                              <CurrencyInput
                                  value={item.priceActual || 0}
                                  onChange={(value) => handleUpdateItem(group.id, item.id, 'priceActual', value)}
                                  currencyCode={currency}
                                  className="w-full border border-slate-200 dark:border-slate-600 focus:border-indigo-500 rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 dark:text-white transition-colors shadow-sm"
                                />
                            </td>
                            <td className="py-3 px-6 text-right bg-indigo-50/10 dark:bg-indigo-900/10 border-r border-slate-100 dark:border-slate-700/50">
                              <span className={`font-medium ${itemSubtotalActual > itemSubtotalPlan && type === 'expense' ? 'text-rose-600 dark:text-rose-400 font-bold' : (itemSubtotalActual < itemSubtotalPlan && type === 'income' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-slate-200')}`}>
                                {formatCurrency(itemSubtotalActual, currency)}
                              </span>
                            </td>
                          </>
                        )}

                        <td className="py-3 px-6 text-right">
                          {type !== 'income' && (
                            <button
                              onClick={() => setConfirmDeleteItem({ groupId: group.id, itemId: item.id })}
                              className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {type !== 'income' && (
                <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <button
                    onClick={() => handleAddItem(group.id)}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    <Plus size={16} />
                    Tambah Item
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
