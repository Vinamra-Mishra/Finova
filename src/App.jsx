import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ExpenseTracker from './components/ExpenseTracker';
import InvestmentTracker from './components/InvestmentTracker';
import EmiCalculator from './components/EmiCalculator';
import SipCalculator from './components/SipCalculator';
import { storage } from './utils/storage';
import { CheckCircle2, AlertTriangle, AlertCircle, X, Zap, Moon, Sun, RefreshCw } from 'lucide-react';
import { fetchExchangeRates, getCurrencyFormatter, getCurrencyFormatterWithDecimals, formatCompact } from './utils/currency';

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
  const [currency, setCurrency] = useState(storage.getCurrency());
  const [rates, setRates] = useState(storage.getRates());
  const [ratesUpdated, setRatesUpdated] = useState(storage.getRatesUpdated());
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

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
  useEffect(() => { storage.saveCurrency(currency); }, [currency]);
  useEffect(() => { storage.saveRates(rates); }, [rates]);
  useEffect(() => { storage.saveRatesUpdated(ratesUpdated); }, [ratesUpdated]);

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

  const updateExchangeRates = async () => {
    setIsUpdatingRates(true);
    try {
      const newRates = await fetchExchangeRates();
      setRates(newRates);
      const now = new Date().toISOString();
      setRatesUpdated(now);
      showToast('Exchange rates updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update exchange rates. Check connection.', 'danger');
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const rate = rates[currency] || 1;
  const fmt = (v) => getCurrencyFormatter(currency).format(v * rate);
  const fmtDecimals = (v) => getCurrencyFormatterWithDecimals(currency).format(v * rate);
  const fmtK = (v) => formatCompact(v * rate, currency);

  const renderContent = () => {
    const key = currentTab; // re-mount on tab change for fresh animations
    const commonProps = { currency, rate, fmtK };
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard key={key} expenses={expenses} investments={investments} budgetLimit={budgetLimit} setCurrentTab={setCurrentTab} fmt={fmt} {...commonProps} />;
      case 'expenses':
        return <ExpenseTracker key={key} expenses={expenses} setExpenses={setExpenses} budgetLimit={budgetLimit} setBudgetLimit={setBudgetLimit} showToast={showToast} fmt={fmtDecimals} {...commonProps} />;
      case 'investments':
        return <InvestmentTracker key={key} investments={investments} setInvestments={setInvestments} showToast={showToast} fmt={fmt} {...commonProps} />;
      case 'emi':
        return <EmiCalculator key={key} fmt={fmt} {...commonProps} />;
      case 'sip':
        return <SipCalculator key={key} fmt={fmt} {...commonProps} />;
      default:
        return <Dashboard key={key} expenses={expenses} investments={investments} budgetLimit={budgetLimit} setCurrentTab={setCurrentTab} fmt={fmt} {...commonProps} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        theme={theme}
        toggleTheme={toggleTheme}
        currency={currency}
        setCurrency={setCurrency}
        updateExchangeRates={updateExchangeRates}
        isUpdatingRates={isUpdatingRates}
        ratesUpdated={ratesUpdated}
      />

      {/* ─── Mobile Top Bar ─── */}
      <header className="mobile-top-bar">
        <div className="mobile-top-bar-logo">
          <div className="sidebar-logo-icon" style={{ width: 28, height: 28, borderRadius: 8 }}>
            <Zap size={14} strokeWidth={2.5} />
          </div>
          <span className="sidebar-logo-name" style={{ fontSize: '0.95rem' }}>Finova</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="mobile-currency-wrapper">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="currency-select-dropdown"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
          <button
            onClick={updateExchangeRates}
            disabled={isUpdatingRates}
            className="icon-btn-mobile"
            title="Update exchange rates"
            style={{
              padding: '0.35rem',
              borderRadius: 8,
              background: 'var(--input-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28
            }}
          >
            <RefreshCw size={14} className={isUpdatingRates ? 'spin' : ''} />
          </button>
          <button
            onClick={toggleTheme}
            style={{
              padding: '0.35rem',
              borderRadius: 8,
              background: 'var(--input-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28
            }}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </header>

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

      <style>{`
        .mobile-top-bar {
          display: none;
          height: 56px;
          padding: 0 1.25rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 150;
          transition: background 0.3s ease, border-color 0.3s ease;
        }
        .mobile-top-bar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .currency-select-dropdown {
          background: var(--input-bg);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-family: var(--font-family);
          font-weight: 500;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .currency-select-dropdown:focus {
          border-color: var(--accent-color);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .mobile-top-bar {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}
