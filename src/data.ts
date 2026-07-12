import { BudgetData, ProfileType } from './types';
import templateData from '../template.json';

export const generateId = () => crypto.randomUUID();

export const createDefaultBudgetData = (): BudgetData => {
  return JSON.parse(JSON.stringify(templateData)) as BudgetData;
};

export const getProfileTemplate = (profile: ProfileType): BudgetData => {
  const data = createDefaultBudgetData();
  data.settings.profile = profile;
  if (profile === 'married') {
    data.incomes[0].items.push({ id: generateId(), name: 'Gaji Pasangan', planned: 0, actual: 0, duration: 1 });
    data.expenses[0].subcategories.find(s => s.name === 'Rumah')?.items.push({ id: generateId(), name: 'Kebutuhan Rumah Tangga Bersama', planned: 0, actual: 0, duration: 1 });
  } else if (profile === 'family') {
    data.incomes[0].items.push({ id: generateId(), name: 'Gaji Pasangan', planned: 0, actual: 0, duration: 1 });
    data.expenses[0].subcategories.find(s => s.name === 'Anak')?.items.push(
      { id: generateId(), name: 'Susu & Popok Anak', planned: 0, actual: 0, duration: 1 },
      { id: generateId(), name: 'Biaya Sekolah Anak', planned: 0, actual: 0, duration: 1 }
    );
    data.expenses[2].subcategories.find(s => s.name === 'Simpanan')?.items.push({ id: generateId(), name: 'Tabungan Pendidikan Anak', planned: 0, actual: 0, duration: 1 });
  }
  return data;
};

export const defaultBudgetData = createDefaultBudgetData();
