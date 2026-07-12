export interface BudgetItem {
  id: string;
  name: string;
  planned: number;
  actual: number;
  duration: number;
}

export interface BudgetGroup {
  id: string;
  name: string;
  items: BudgetItem[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  targetPercentage: number;
  subcategories: BudgetGroup[];
}

export interface UserSettings {
  name: string;
  profile: ProfileType;
  realizationMonth?: number;
  realizationYear?: number;
  warningThreshold?: number;
  darkMode?: boolean;
  currency?: string;
}

export interface RealizationHistory {
  id: string;
  month: number;
  year: number;
  income: number;
  expense: number;
}

export interface BudgetData {
  settings: UserSettings;
  incomes: BudgetGroup[];
  expenses: ExpenseCategory[];
  history?: RealizationHistory[];
}

export type ProfileType = 'single' | 'married' | 'family';
export type DurationType = 1 | 3 | 6 | 12;
