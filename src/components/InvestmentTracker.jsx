import React, { useState, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, RefreshCw, Download, Upload, X, Search } from 'lucide-react';
import { exportToCSV, parseCSV } from '../utils/csv';
import { cssVar, tooltipDefaults, doughnutCenterLabel, fmtFull } from '../utils/chartUtils';

ChartJS.register(ArcElement, Tooltip, Legend, doughnutCenterLabel);

const CATEGORIES = ['Stocks', 'Mutual Funds', 'Crypto', 'Gold', 'Real Estate', 'Fixed Deposits', 'Others'];
const CAT_COLORS = {
  'Stocks': '#0071e3',
  'Mutual Funds': '#5856d6',
  'Crypto': '#af52de',
  'Gold': '#ff9500',
  'Real Estate': '#34c759',
  'Fixed Deposits': '#ff9f0a',
  'Others': '#8e8e93',
};

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);


export default function InvestmentTracker({ investments, setInvestments, showToast }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [quickUpdateId, setQuickUpdateId] = useState(null);
  const [quickValueInput, setQuickValueInput] = useState('');

  const summary = useMemo(() => {
    let totalInvested = 0, totalCurrent = 0;
    investments.forEach(inv => {
      totalInvested += Number(inv.investedAmount || 0);
      totalCurrent += Number(inv.currentValue || 0);
    });
    const net = totalCurrent - totalInvested;
    const roi = totalInvested > 0 ? (net / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrent, net, roi };
  }, [investments]);

  const filtered = useMemo(() =>
    investments
      .filter(inv => inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || inv.category.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [investments, searchQuery]
  );

  const chartData = useMemo(() => {
    const sums = {};
    investments.forEach(inv => { sums[inv.category] = (sums[inv.category] || 0) + Number(inv.currentValue || 0); });
    const labels = [], data = [], colors = [], hoverColors = [];
    CATEGORIES.forEach(c => {
      if (sums[c] > 0) {
        labels.push(c);
        data.push(sums[c]);
        colors.push(CAT_COLORS[c] + 'e6');
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
  }, [investments]);

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
            const pct = summary.totalCurrent > 0 ? ((ctx.raw / summary.totalCurrent) * 100).toFixed(1) : '0.0';
            return `  ${fmt(ctx.raw)}  (${pct}%)`;
          }
        }
      },
      doughnutCenterLabel: true,
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || Number(investedAmount) <= 0 || Number(currentValue) < 0) return showToast('Fill in valid details.', 'danger');
    const holding = { id: editingId || Math.random().toString(36).slice(2, 9), name: name.trim(), category, investedAmount: parseFloat(investedAmount), currentValue: parseFloat(currentValue), date };
    if (editingId) { setInvestments(prev => prev.map(x => x.id === editingId ? holding : x)); showToast('Asset updated!', 'success'); }
    else { setInvestments(prev => [holding, ...prev]); showToast('Asset added!', 'success'); }
    closeForm();
  };

  const startEdit = (inv) => { setEditingId(inv.id); setName(inv.name); setCategory(inv.category); setInvestedAmount(inv.investedAmount); setCurrentValue(inv.currentValue); setDate(inv.date); setIsFormOpen(true); };
  const deleteInv = (id) => { if (window.confirm('Remove this asset?')) { setInvestments(prev => prev.filter(x => x.id !== id)); showToast('Asset removed.', 'warning'); } };
  const closeForm = () => { setEditingId(null); setName(''); setCategory(CATEGORIES[0]); setInvestedAmount(''); setCurrentValue(''); setDate(new Date().toISOString().split('T')[0]); setIsFormOpen(false); };

  const handleQuickUpdate = (id) => {
    const val = parseFloat(quickValueInput);
    if (isNaN(val) || val < 0) return showToast('Invalid amount.', 'danger');
    setInvestments(prev => prev.map(x => x.id === id ? { ...x, currentValue: val } : x));
    showToast('Value updated!', 'success');
    setQuickUpdateId(null); setQuickValueInput('');
  };

  const handleExport = () => { exportToCSV(investments, 'portfolio.csv'); showToast('Portfolio exported!', 'success'); };
  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = parseCSV(ev.target.result);
        if (!data.every(x => 'name' in x && 'category' in x && 'investedAmount' in x && 'currentValue' in x)) return showToast('Invalid CSV format.', 'danger');
        setInvestments(prev => [...data, ...prev]);
        showToast(`Imported ${data.length} holdings!`, 'success');
      } catch { showToast('Parse error.', 'danger'); }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="animate-fade">

      {/* ─── Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="page-subtitle">{investments.length} assets · {fmt(summary.totalCurrent)} current value</p>
        </div>
        <div className="page-header-actions">
          <button className="apple-btn apple-btn-secondary" onClick={handleExport} style={{ fontSize: '0.82rem' }}>
            <Download size={14} /> Export
          </button>
          <label className="apple-btn apple-btn-secondary" style={{ fontSize: '0.82rem', cursor: 'pointer' }}>
            <Upload size={14} /> Import
            <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button className="apple-btn apple-btn-primary" onClick={() => setIsFormOpen(true)}>
            <Plus size={15} /> Add Asset
          </button>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Invested', value: fmt(summary.totalInvested), color: 'var(--text-primary)', delay: 0 },
          { label: 'Current Value', value: fmt(summary.totalCurrent), color: 'var(--accent-color)', delay: 60 },
          { label: 'Net P&L', value: `${summary.net >= 0 ? '+' : ''}${fmt(summary.net)}`, color: summary.net >= 0 ? 'var(--success)' : 'var(--danger)', delay: 120 },
          { label: 'Total ROI', value: `${summary.roi >= 0 ? '+' : ''}${summary.roi.toFixed(2)}%`, color: summary.roi >= 0 ? 'var(--success)' : 'var(--danger)', delay: 180 },
        ].map(({ label, value, color, delay }) => (
          <div key={label} className="glass-panel" style={{ animation: `fadeInUp 0.4s ${delay}ms both` }}>
            <p className="metric-label">{label}</p>
            <p className="metric-value" style={{ color, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {summary.net >= 0 && label === 'Net P&L' && <TrendingUp size={20} strokeWidth={2} />}
              {summary.net < 0 && label === 'Net P&L' && <TrendingDown size={20} strokeWidth={2} />}
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Main Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.75fr', gap: '1.5rem' }}>

        {/* Allocation Chart */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.4s 0.15s both' }}>
          <p className="section-title" style={{ marginBottom: '1.25rem' }}>Asset Allocation</p>
          {investments.length > 0 ? (
            <div style={{ height: '240px' }}>
              <Doughnut data={chartData} options={chartOpts} />
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><TrendingUp size={22} strokeWidth={1.5} /></div>
              <p className="text-sm text-secondary">No assets yet</p>
            </div>
          )}
          {/* Category breakdown */}
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {CATEGORIES.filter(c => investments.some(i => i.category === c)).map(c => {
              const total = investments.filter(i => i.category === c).reduce((s, i) => s + Number(i.currentValue || 0), 0);
              const pct = summary.totalCurrent > 0 ? (total / summary.totalCurrent) * 100 : 0;
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

        {/* Holdings Table */}
        <div className="glass-panel" style={{ animation: 'fadeInUp 0.4s 0.2s both', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <p className="section-title">Holdings</p>
            <div style={{ position: 'relative', width: 180 }}>
              <input
                type="text" placeholder="Search..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="apple-input"
                style={{ paddingLeft: '2.1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', fontSize: '0.82rem' }}
              />
              <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          <div className="apple-table-container" style={{ flex: 1, overflowY: 'auto', maxHeight: 420 }}>
            <table className="apple-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Invested</th>
                  <th>Current Value</th>
                  <th>Return</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => {
                  const profit = Number(inv.currentValue) - Number(inv.investedAmount);
                  const roiP = Number(inv.investedAmount) > 0 ? (profit / Number(inv.investedAmount)) * 100 : 0;
                  const isProfit = profit >= 0;
                  return (
                    <tr key={inv.id} style={{ animation: `fadeInUp 0.3s ${i * 40}ms both` }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: 8, height: 32, borderRadius: 4, background: CAT_COLORS[inv.category] || 'var(--text-tertiary)', flexShrink: 0 }} />
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.87rem', color: 'var(--text-primary)' }}>{inv.name}</p>
                            <span className="badge badge-info" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>{inv.category}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.87rem' }}>{fmt(inv.investedAmount)}</td>
                      <td>
                        {quickUpdateId === inv.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <input
                              type="number" value={quickValueInput}
                              onChange={e => setQuickValueInput(e.target.value)}
                              style={{ width: 80, padding: '0.25rem 0.4rem', borderRadius: 6, border: '1px solid var(--accent-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                              autoFocus
                            />
                            <button onClick={() => handleQuickUpdate(inv.id)} style={{ background: 'var(--success)', border: 'none', borderRadius: 5, color: '#fff', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>✓</button>
                            <button onClick={() => setQuickUpdateId(null)} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 5, color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>✗</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.87rem' }}>{fmt(inv.currentValue)}</span>
                            <button
                              onClick={() => { setQuickUpdateId(inv.id); setQuickValueInput(inv.currentValue); }}
                              className="icon-btn" style={{ width: 24, height: 24, borderRadius: 6 }}
                              title="Update value"
                            >
                              <RefreshCw size={11} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {isProfit ? <TrendingUp size={13} color="var(--success)" /> : <TrendingDown size={13} color="var(--danger)" />}
                          <div>
                            <p style={{ color: isProfit ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>
                              {isProfit ? '+' : ''}{fmt(profit)}
                            </p>
                            <p style={{ color: isProfit ? 'var(--success)' : 'var(--danger)', fontSize: '0.72rem' }}>
                              {isProfit ? '+' : ''}{roiP.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          <button className="icon-btn" onClick={() => startEdit(inv)}><Edit2 size={13} /></button>
                          <button className="icon-btn danger" onClick={() => deleteInv(inv.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <p className="text-sm text-secondary">No assets found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ─── Drawer ─── */}
      {isFormOpen && (
        <div className="panel-overlay" onClick={closeForm}>
          <div className="panel-drawer" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <h2 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{editingId ? 'Edit Asset' : 'Add Asset'}</h2>
              <button className="icon-btn" onClick={closeForm} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--input-bg)' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              <div>
                <label className="apple-label">Asset Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Apple (AAPL), Bitcoin" className="apple-input" required />
              </div>
              <div>
                <label className="apple-label">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="apple-input apple-select">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="apple-label">Invested Amount ($)</label>
                <input type="number" step="0.01" value={investedAmount} onChange={e => setInvestedAmount(e.target.value)} placeholder="0.00" className="apple-input" required />
              </div>
              <div>
                <label className="apple-label">Current Value ($)</label>
                <input type="number" step="0.01" value={currentValue} onChange={e => setCurrentValue(e.target.value)} placeholder="0.00" className="apple-input" required />
              </div>
              <div>
                <label className="apple-label">Purchase Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="apple-input" required />
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                <button type="button" className="apple-btn apple-btn-secondary" onClick={closeForm} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="apple-btn apple-btn-primary" style={{ flex: 1 }}>{editingId ? 'Update' : 'Add Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
