export interface BudgetItem {
  id: string;
  name: string;
  planned: number;
  actual: number;
  duration: number;
}

export interface BusinessBudgetItem {
  id: string;
  name: string;
  quantity: number;
  quantityActual?: number;
  pricePlan: number;
  priceActual: number;
  duration: number;
  isHPP?: boolean;
  linkedId?: string;
}

export interface BudgetGroup {
  id: string;
  name: string;
  items: BudgetItem[];
}

export interface BusinessBudgetGroup {
  id: string;
  name: string;
  items: BusinessBudgetItem[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  targetPercentage: number;
  subcategories: BudgetGroup[];
}

export interface BusinessExpenseCategory {
  id: string;
  name: string;
  targetPercentage: number;
  subcategories: BusinessBudgetGroup[];
}

export interface UserSettings {
  name: string;
  businessName?: string;
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
  businessIncome?: number;
  businessExpense?: number;
}

export interface BudgetData {
  settings: UserSettings;
  incomes: BudgetGroup[];
  expenses: ExpenseCategory[];
  businessIncomes?: BusinessBudgetGroup[];
  businessExpenses?: BusinessExpenseCategory[];
  history?: RealizationHistory[];
}

export type ProfileType = 'single' | 'married' | 'family';
export type DurationType = 1 | 3 | 6 | 12;
