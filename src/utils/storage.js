const KEYS = {
  EXPENSES: 'pf_dashboard_expenses',
  INVESTMENTS: 'pf_dashboard_investments',
  BUDGET_LIMIT: 'pf_dashboard_budget_limit',
  THEME: 'pf_dashboard_theme'
};

const DEFAULT_EXPENSES = [
  { id: 'e1', description: 'Apple One Subscription', amount: 19.95, category: 'Entertainment', date: '2026-07-10' },
  { id: 'e2', description: 'Blue Bottle Coffee', amount: 6.50, category: 'Food & Dining', date: '2026-07-12' },
  { id: 'e3', description: 'Apartment Rent', amount: 1500.00, category: 'Housing', date: '2026-07-01' },
  { id: 'e4', description: 'Supermarket Groceries', amount: 124.30, category: 'Food & Dining', date: '2026-07-05' },
  { id: 'e5', description: 'Uber Ride', amount: 24.50, category: 'Transportation', date: '2026-07-08' }
];

const DEFAULT_INVESTMENTS = [
  { id: 'i1', name: 'Apple Inc. (AAPL)', category: 'Stocks', investedAmount: 2500, currentValue: 2850, date: '2026-01-15' },
  { id: 'i2', name: 'Vanguard S&P 500 ETF (VOO)', category: 'Mutual Funds', investedAmount: 5000, currentValue: 5450, date: '2026-02-10' },
  { id: 'i3', name: 'Ethereum (ETH)', category: 'Crypto', investedAmount: 1500, currentValue: 1280, date: '2026-03-22' },
  { id: 'i4', name: 'Physical Gold', category: 'Gold', investedAmount: 2000, currentValue: 2150, date: '2025-11-05' }
];

export const storage = {
  getExpenses() {
    const data = localStorage.getItem(KEYS.EXPENSES);
    if (!data) {
      this.saveExpenses(DEFAULT_EXPENSES);
      return DEFAULT_EXPENSES;
    }
    return JSON.parse(data);
  },

  saveExpenses(expenses) {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  },

  getInvestments() {
    const data = localStorage.getItem(KEYS.INVESTMENTS);
    if (!data) {
      this.saveInvestments(DEFAULT_INVESTMENTS);
      return DEFAULT_INVESTMENTS;
    }
    return JSON.parse(data);
  },

  saveInvestments(investments) {
    localStorage.setItem(KEYS.INVESTMENTS, JSON.stringify(investments));
  },

  getBudgetLimit() {
    const data = localStorage.getItem(KEYS.BUDGET_LIMIT);
    return data ? Number(data) : 2500;
  },

  saveBudgetLimit(limit) {
    localStorage.setItem(KEYS.BUDGET_LIMIT, limit.toString());
  },

  getTheme() {
    return localStorage.getItem(KEYS.THEME) || 'light';
  },

  saveTheme(theme) {
    localStorage.setItem(KEYS.THEME, theme);
  }
};
