import React, { useState, useMemo, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Plus, Trash2, Edit2, Search, Download, Upload, X, CreditCard } from 'lucide-react';
import { exportToCSV, parseCSV } from '../utils/csv';
import { cssVar, tooltipDefaults, doughnutCenterLabel } from '../utils/chartUtils';

ChartJS.register(ArcElement, Tooltip, Legend, doughnutCenterLabel);

const CATEGORIES = ['Housing', 'Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Others'];

const CAT_COLORS = {
  'Housing': '#ff3b30',
  'Food & Dining': '#ff9500',
  'Transportation': '#ffcc00',
  'Utilities': '#30d158',
  'Entertainment': '#5856d6',
  'Healthcare': '#007aff',
  'Shopping': '#af52de',
  'Others': '#8e8e93',
};

export default function ExpenseTracker({ expenses, setExpenses, budgetLimit, setBudgetLimit, showToast, currency, rate, fmt, fmtK }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const importRef = useRef(null);

  const currentMonthTotal = useMemo(() => {
    const today = new Date();
    return expenses
      .filter(e => { const d = new Date(e.date); return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth(); })
      .reduce((s, e) => s + Number(e.amount), 0);
  }, [expenses]);

  const budgetPct = Math.min(100, (currentMonthTotal / budgetLimit) * 100);
  const budgetColor = budgetPct >= 90 ? 'var(--danger)' : budgetPct >= 70 ? 'var(--warning)' : 'var(--success)';

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const q = searchQuery.toLowerCase();
      return (e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
        && (catFilter === 'All' || e.category === catFilter);
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, searchQuery, catFilter]);

  const chartData = useMemo(() => {
    const sums = {};
    CATEGORIES.forEach(c => { sums[c] = 0; });
    expenses.forEach(e => { sums[e.category] = (sums[e.category] || 0) + Number(e.amount); });
    const labels = [], data = [], colors = [], hoverColors = [];
    CATEGORIES.forEach(c => {
      if (sums[c] > 0) {
        labels.push(c);
        data.push(sums[c]);
        colors.push(CAT_COLORS[c] + 'e6');  // slight transparency
        hoverColors.push(CAT_COLORS[c]);
      }
    });
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        hoverBackgroundColor: hoverColors,
        borderWidth: 3,
        borderColor: cssVar('--bg-secondary', '#fff'),
        hoverOffset: 6,
      }]
    };
  }, [expenses]);

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    animation: { animateRotate: true, duration: 800, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: cssVar('--text-secondary', '#6c6c70'),
          font: { family: 'Outfit', size: 11 },
          boxWidth: 10,
          boxHeight: 10,
          padding: 14,
          usePointStyle: true,
          pointStyleWidth: 10,
        }
      },
      tooltip: {
        ...tooltipDefaults(),
        callbacks: {
          label: ctx => {
            const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : '0.0';
            return `  ${fmt(ctx.raw)}  (${pct}%)`;
          }
        }
      },
      doughnutCenterLabel: {
        format: fmt
      },
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) return showToast('Enter a valid description and amount.', 'danger');
    const tx = { id: editingId || Math.random().toString(36).slice(2, 9), description: description.trim(), amount: parseFloat(amount) / rate, category, date };
    if (editingId) {
      setExpenses(prev => prev.map(x => x.id === editingId ? tx : x));
      showToast('Transaction updated!', 'success');
    } else {
      setExpenses(prev => [tx, ...prev]);
      showToast('Expense added!', 'success');
    }
    closeForm();
  };

  const startEdit = (e) => { setEditingId(e.id); setDescription(e.description); setAmount((e.amount * rate).toFixed(2)); setCategory(e.category); setDate(e.date); setIsFormOpen(true); };
  const deleteExp = (id) => { if (window.confirm('Delete this expense?')) { setExpenses(prev => prev.filter(x => x.id !== id)); showToast('Deleted.', 'warning'); } };

  const closeForm = () => { setEditingId(null); setDescription(''); setAmount(''); setCategory(CATEGORIES[0]); setDate(new Date().toISOString().split('T')[0]); setIsFormOpen(false); };

  const handleExport = () => { exportToCSV(expenses, 'expenses.csv'); showToast('Exported to CSV!', 'success'); };
  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = parseCSV(ev.target.result);
        if (!data.every(x => 'amount' in x && 'description' in x && 'category' in x && 'date' in x)) return showToast('Invalid CSV format.', 'danger');
        setExpenses(prev => [...data, ...prev]);
        showToast(`Imported ${data.length} records!`, 'success');
      } catch { showToast('Parse error.', 'danger'); }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const totalAll = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="animate-fade">

      {/* ─── Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">{expenses.length} transactions · {fmt(totalAll)} total</p>
        </div>
        <div className="page-header-actions">
          <button className="apple-btn apple-btn-secondary" onClick={handleExport} style={{ fontSize: '0.82rem' }}>
            <Download size={14} /> Export
          </button>
          <label className="apple-btn apple-btn-secondary" style={{ fontSize: '0.82rem', cursor: 'pointer' }}>
            <Upload size={14} /> Import
            <input ref={importRef} type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button className="apple-btn apple-btn-primary" onClick={() => setIsFormOpen(true)}>
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* ─── Budget Progress Card ─── */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem', animation: 'fadeInUp 0.4s 0.05s both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <p className="section-title">Monthly Budget</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {fmt(currentMonthTotal)} spent of {fmt(budgetLimit)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: budgetColor }}>{budgetPct.toFixed(0)}%</span>
            {currentMonthTotal > budgetLimit && (
              <span className="badge badge-danger">Over budget</span>
            )}
          </div>
        </div>

        <div className="progress-bar-track" style={{ marginBottom: '1.25rem' }}>
          <div className="progress-bar-fill" style={{ width: `${budgetPct}%`, background: budgetColor }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label className="apple-label" style={{ margin: 0, flexShrink: 0 }}>Adjust Limit</label>
          <input
            type="range"
            min={Math.round(500 * rate)}
            max={Math.round(15000 * rate)}
            step={Math.round(250 * rate)}
            value={Math.round(budgetLimit * rate)}
            onChange={e => setBudgetLimit(Number(e.target.value) / rate)}
            style={{ flex: 1, minWidth: 120 }}
          />
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>{fmt(budgetLimit)}</span>
        </div>
      </div>

      {/* ─── Main Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>

        {/* Chart */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.4s 0.1s both' }}>
          <p className="section-title" style={{ marginBottom: '1.25rem' }}>Spending by Category</p>
          {expenses.length > 0 ? (
            <div style={{ height: '280px' }}>
              <Doughnut data={chartData} options={chartOpts} />
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><CreditCard size={22} strokeWidth={1.5} /></div>
              <p className="text-sm text-secondary">No expense data yet</p>
            </div>
          )}
          {/* Category totals legend */}
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {CATEGORIES.filter(c => expenses.some(e => e.category === c)).map(c => {
              const total = expenses.filter(e => e.category === c).reduce((s, e) => s + Number(e.amount), 0);
              const pct = totalAll > 0 ? (total / totalAll) * 100 : 0;
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[c], flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1 }}>{c}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(total)}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', width: '32px', textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction list */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.4s 0.15s both' }}>

          {/* Search + filter row */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <input
                type="text" placeholder="Search..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="apple-input"
                style={{ paddingLeft: '2.4rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            </div>
            <select
              value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="apple-input apple-select"
              style={{ width: 150, paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 420 }}>
            {filtered.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filtered.map((exp, i) => (
                  <div
                    key={exp.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.9rem', borderRadius: '14px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-color)',
                      transition: 'background 0.15s ease',
                      animation: `fadeInUp 0.35s ${i * 30}ms both`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--input-bg)'}
                  >
                    {/* Color indicator */}
                    <div style={{ width: 4, height: 36, borderRadius: 2, background: CAT_COLORS[exp.category] || 'var(--text-tertiary)', flexShrink: 0 }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exp.description}
                      </p>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.2rem' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{exp.category}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                          {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--danger)', flexShrink: 0 }}>
                      -{fmt(exp.amount)}
                    </p>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                      <button className="icon-btn" onClick={() => startEdit(exp)}><Edit2 size={13} /></button>
                      <button className="icon-btn danger" onClick={() => deleteExp(exp.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Search size={22} strokeWidth={1.5} /></div>
                <p className="text-sm text-secondary">No transactions found</p>
                <p className="text-xs text-muted">Try adjusting your filters</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ─── Drawer ─── */}
      {isFormOpen && (
        <div className="panel-overlay" onClick={closeForm}>
          <div className="panel-drawer" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <h2 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{editingId ? 'Edit Expense' : 'New Expense'}</h2>
              <button className="icon-btn" onClick={closeForm} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--input-bg)' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              <div>
                <label className="apple-label">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Coffee, Rent" className="apple-input" required />
              </div>
              <div>
                <label className="apple-label">Amount ({currency})</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="apple-input" required />
              </div>
              <div>
                <label className="apple-label">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="apple-input apple-select">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="apple-label">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="apple-input" required />
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                <button type="button" className="apple-btn apple-btn-secondary" onClick={closeForm} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="apple-btn apple-btn-primary" style={{ flex: 1 }}>{editingId ? 'Update' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
