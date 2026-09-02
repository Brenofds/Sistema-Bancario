export interface Expense {
  id: number;
  date: string;
  amount: number;
  category: string;
  description: string;
  recurring: boolean;
}

export interface Budget {
  limit: number;
  alerts: Alert[];
}

export interface Alert {
  id: number;
  message: string;
}

export interface AppData {
  expenses: Expense[];
  budget: Budget;
  bankSync: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
