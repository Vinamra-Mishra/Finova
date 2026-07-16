import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ExpenseTracker from './components/ExpenseTracker';
import InvestmentTracker from './components/InvestmentTracker';
import EmiCalculator from './components/EmiCalculator';
import SipCalculator from './components/SipCalculator';
import { storage } from './utils/storage';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

const TOAST_ICONS = {
  success: <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />,
  warning: <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />,
  danger: <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />,
};

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState(storage.getTheme());
  const [expenses, setExpenses] = useState(storage.getExpenses());
  const [investments, setInvestments] = useState(storage.getInvestments());
  const [budgetLimit, setBudgetLimit] = useState(storage.getBudgetLimit());
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // ── Theme sync ──
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d0d0f' : '#f2f2f7');
    storage.saveTheme(theme);
  }, [theme]);

  // ── Persist data ──
  useEffect(() => { storage.saveExpenses(expenses); }, [expenses]);
  useEffect(() => { storage.saveInvestments(investments); }, [investments]);
  useEffect(() => { storage.saveBudgetLimit(budgetLimit); }, [budgetLimit]);

  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');

  const showToast = (message, type = 'success') => {
    setToast({ show: false, message: '', type }); // reset first for re-trigger
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setToast({ show: true, message, type }));
    });
  };

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast(p => ({ ...p, show: false })), 3200);
    return () => clearTimeout(t);
  }, [toast.show, toast.message]);

  const renderContent = () => {
    const key = currentTab; // re-mount on tab change for fresh animations
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard key={key} expenses={expenses} investments={investments} budgetLimit={budgetLimit} setCurrentTab={setCurrentTab} />;
      case 'expenses':
        return <ExpenseTracker key={key} expenses={expenses} setExpenses={setExpenses} budgetLimit={budgetLimit} setBudgetLimit={setBudgetLimit} showToast={showToast} />;
      case 'investments':
        return <InvestmentTracker key={key} investments={investments} setInvestments={setInvestments} showToast={showToast} />;
      case 'emi':
        return <EmiCalculator key={key} />;
      case 'sip':
        return <SipCalculator key={key} />;
      default:
        return <Dashboard key={key} expenses={expenses} investments={investments} budgetLimit={budgetLimit} setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} theme={theme} toggleTheme={toggleTheme} />

      <main className="main-content">
        {renderContent()}
      </main>

      {/* ── Toast ── */}
      {toast.show && (
        <div className="toast">
          {TOAST_ICONS[toast.type]}
          <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => setToast(p => ({ ...p, show: false }))}
            className="icon-btn"
            style={{ width: 24, height: 24, flexShrink: 0, color: 'var(--text-secondary)' }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
