import React, { useMemo, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler, BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  Wallet, TrendingUp, TrendingDown, ArrowDownRight, Percent,
  Calendar, ArrowRight, ShoppingBag
} from 'lucide-react';
import {
  cssVar, buildGradient, tooltipDefaults, axisDefaults, fmtK, fmtFull
} from '../utils/chartUtils';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

const fmt = fmtFull;

/* ─────────── KPI stat card ─────────── */
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, valueColor, delay = 0 }) {
  return (
    <div
      className="glass-panel glass-panel-hover"
      style={{ animation: `fadeInUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms both` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p className="metric-label">{label}</p>
          <p className="metric-value" style={{ color: valueColor || 'var(--text-primary)', marginTop: '0.4rem' }}>
            {value}
          </p>
        </div>
        <div className="stat-icon-box" style={{ background: iconBg, color: iconColor }}>
          <Icon size={20} strokeWidth={1.75} />
        </div>
      </div>
      {sub && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ─────────── Gradient line chart ─────────── */
function NetWorthChart({ netWorth }) {
  const labels = ['6M', '5M', '4M', '3M', '2M', '1M', 'Now'];
  const rawData = [0.76, 0.82, 0.85, 0.87, 0.92, 0.97, 1].map(f => Math.round(netWorth * f));

  const data = {
    labels,
    datasets: [{
      label: 'Net Worth',
      data: rawData,
      borderColor: '#0a84ff',
      backgroundColor: (ctx) => {
        const { chart } = ctx;
        const { chartArea } = chart;
        if (!chartArea) return 'transparent';
        return buildGradient(
          chart.ctx, chartArea,
          'rgba(10,132,255,0.22)',
          'rgba(10,132,255,0.00)'
        );
      },
      fill: true,
      borderWidth: 2.5,
      tension: 0.42,
      pointRadius: 0,
      pointHitRadius: 24,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#0a84ff',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    animation: { duration: 900, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipDefaults(),
        callbacks: {
          title: (items) => `${items[0].label} ago`,
          label: (ctx) => `  Net Worth  ${fmt(ctx.raw)}`,
        },
      },
    },
    scales: {
      ...axisDefaults({ yTicks: { callback: fmtK } }),
    },
  };

  return <Line data={data} options={options} />;
}

/* ─────────── Gradient bar chart ─────────── */
function SpendBarChart({ expenses }) {
  const months = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      arr.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString('en-US', { month: 'short' }),
      });
    }
    return arr;
  }, []);

  const values = useMemo(() =>
    months.map(({ year, month }) =>
      expenses
        .filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === month; })
        .reduce((s, e) => s + Number(e.amount), 0)
    ),
  [expenses, months]);

  const maxVal = Math.max(...values, 1);

  // Per-bar color based on value vs average
  const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);

  const data = {
    labels: months.map(m => m.label),
    datasets: [{
      label: 'Monthly Spend',
      data: values,
      backgroundColor: (ctx) => {
        const { chart, dataIndex } = ctx;
        const { chartArea } = chart;
        if (!chartArea) return 'rgba(10,132,255,0.6)';
        const isHigh = values[dataIndex] > avg * 1.15;
        const colorTop = isHigh ? 'rgba(255,69,58,0.85)' : 'rgba(10,132,255,0.85)';
        const colorBot = isHigh ? 'rgba(255,69,58,0.20)' : 'rgba(10,132,255,0.20)';
        return buildGradient(chart.ctx, chartArea, colorTop, colorBot);
      },
      hoverBackgroundColor: (ctx) => {
        const { chart, dataIndex } = ctx;
        const { chartArea } = chart;
        if (!chartArea) return 'rgba(10,132,255,0.9)';
        const isHigh = values[dataIndex] > avg * 1.15;
        return isHigh ? 'rgba(255,69,58,0.95)' : 'rgba(10,132,255,0.95)';
      },
      borderRadius: { topLeft: 8, topRight: 8 },
      borderSkipped: 'bottom',
      borderWidth: 0,
      barPercentage: 0.62,
      categoryPercentage: 0.75,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipDefaults(),
        callbacks: {
          label: (ctx) => `  Spent  ${fmt(ctx.raw)}`,
          afterLabel: (ctx) => {
            const diff = ctx.raw - avg;
            return `  vs avg  ${diff >= 0 ? '+' : ''}${fmt(diff)}`;
          },
        },
      },
      // Custom plugin: draw avg line
      annotation: undefined,
    },
    scales: {
      ...axisDefaults({ yTicks: { callback: fmtK } }),
    },
  };

  // Custom plugin to draw average line
  const avgLinePlugin = {
    id: 'avgLine',
    afterDraw(chart) {
      const { ctx, scales, chartArea } = chart;
      if (!scales.y) return;
      const yPx = scales.y.getPixelForValue(avg);
      if (yPx < chartArea.top || yPx > chartArea.bottom) return;
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = cssVar('--text-tertiary', '#aeaeb2');
      ctx.lineWidth = 1;
      ctx.moveTo(chartArea.left, yPx);
      ctx.lineTo(chartArea.right, yPx);
      ctx.stroke();
      // label
      ctx.font = '500 10px Outfit, sans-serif';
      ctx.fillStyle = cssVar('--text-tertiary', '#aeaeb2');
      ctx.textAlign = 'right';
      ctx.fillText(`avg ${fmtK(avg)}`, chartArea.right - 2, yPx - 4);
      ctx.restore();
    },
  };

  return <Bar data={data} options={options} plugins={[avgLinePlugin]} />;
}

/* ─────────── Dashboard ─────────── */
export default function Dashboard({ expenses, investments, budgetLimit, setCurrentTab }) {
  const DEFAULT_MONTHLY_INCOME = 5000;

  const stats = useMemo(() => {
    let totalInvested = 0, totalCurrentValue = 0;
    investments.forEach(inv => {
      totalInvested += Number(inv.investedAmount || 0);
      totalCurrentValue += Number(inv.currentValue || 0);
    });
    const today = new Date();
    const currentMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
    });
    const monthlySpend = currentMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const savings = Math.max(0, DEFAULT_MONTHLY_INCOME - monthlySpend);
    const savingsRate = (savings / DEFAULT_MONTHLY_INCOME) * 100;
    const cash = 5000;
    const netWorth = totalCurrentValue + cash;
    const totalReturnVal = totalCurrentValue - totalInvested;
    const totalReturnPercent = totalInvested > 0 ? (totalReturnVal / totalInvested) * 100 : 0;
    return { netWorth, monthlySpend, savingsRate, totalReturnVal, totalReturnPercent, totalInvested, totalCurrentValue };
  }, [expenses, investments]);

  const recentActivity = useMemo(() => {
    const list = [
      ...expenses.map(e => ({ id: e.id, type: 'expense', title: e.description, amount: Number(e.amount), date: e.date, cat: e.category })),
      ...investments.map(i => ({ id: i.id, type: 'investment', title: i.name, amount: Number(i.investedAmount), date: i.date, cat: i.category })),
    ];
    return list.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  }, [expenses, investments]);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* ─── Header ─── */}
      <div style={{ marginBottom: '2rem', animation: 'fadeInDown 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both' }}>
        <h1 className="page-title">{greeting} 👋</h1>
        <p className="page-subtitle">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          label="Net Worth" value={fmt(stats.netWorth)}
          sub={`Portfolio ${fmt(stats.totalCurrentValue)} + $5K cash`}
          icon={Wallet} iconBg="var(--accent-light)" iconColor="var(--accent-color)"
          delay={0}
        />
        <StatCard
          label="Monthly Expenses"
          value={fmt(stats.monthlySpend)}
          valueColor={stats.monthlySpend > budgetLimit ? 'var(--danger)' : 'var(--text-primary)'}
          sub={`Budget: ${fmt(budgetLimit)} · ${stats.monthlySpend > budgetLimit ? '⚠️ Over budget' : '✓ Within limit'}`}
          icon={ArrowDownRight}
          iconBg={stats.monthlySpend > budgetLimit ? 'var(--danger-light)' : 'var(--input-bg)'}
          iconColor={stats.monthlySpend > budgetLimit ? 'var(--danger)' : 'var(--text-secondary)'}
          delay={60}
        />
        <StatCard
          label="Portfolio Returns"
          value={`${stats.totalReturnVal >= 0 ? '+' : ''}${fmt(stats.totalReturnVal)}`}
          valueColor={stats.totalReturnVal >= 0 ? 'var(--success)' : 'var(--danger)'}
          sub={`ROI ${stats.totalReturnVal >= 0 ? '+' : ''}${stats.totalReturnPercent.toFixed(2)}% · Invested ${fmt(stats.totalInvested)}`}
          icon={stats.totalReturnVal >= 0 ? TrendingUp : TrendingDown}
          iconBg={stats.totalReturnVal >= 0 ? 'var(--success-light)' : 'var(--danger-light)'}
          iconColor={stats.totalReturnVal >= 0 ? 'var(--success)' : 'var(--danger)'}
          delay={120}
        />
        <StatCard
          label="Savings Rate" value={`${stats.savingsRate.toFixed(0)}%`}
          sub={
            <div>
              <span style={{ display: 'block', marginBottom: '0.4rem' }}>
                {fmt(Math.max(0, DEFAULT_MONTHLY_INCOME - stats.monthlySpend))} saved this month
              </span>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${stats.savingsRate}%`, background: 'var(--success)' }} />
              </div>
            </div>
          }
          icon={Percent} iconBg="var(--success-light)" iconColor="var(--success)"
          delay={180}
        />
      </div>

      {/* ─── Charts Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Net Worth Trend */}
        <div className="glass-panel" style={{ animation: 'fadeInUp 0.5s 0.25s both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <p className="section-title">Net Worth Trend</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>6-month trajectory</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ width: 28, height: 3, borderRadius: 2, background: 'var(--accent-color)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Net Worth</span>
            </div>
          </div>
          <div style={{ height: '220px' }}>
            <NetWorthChart netWorth={stats.netWorth} />
          </div>
        </div>

        {/* Monthly Spend Bar */}
        <div className="glass-panel" style={{ animation: 'fadeInUp 0.5s 0.35s both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <p className="section-title">Monthly Spend</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Last 6 months</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ width: 28, height: 3, borderRadius: 2, borderTop: '1.5px dashed var(--text-tertiary)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Avg line</span>
            </div>
          </div>
          <div style={{ height: '220px' }}>
            <SpendBarChart expenses={expenses} />
          </div>
        </div>

      </div>

      {/* ─── Activity + Quick Actions ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Recent Activity */}
        <div className="glass-panel" style={{ animation: 'fadeInUp 0.5s 0.45s both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <p className="section-title">Recent Activity</p>
            <button onClick={() => setCurrentTab('expenses')} className="apple-btn apple-btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', gap: '0.3rem' }}>
              View All <ArrowRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentActivity.length > 0 ? recentActivity.map((act, i) => (
              <div key={act.id} className="transaction-item" style={{ animation: `fadeInUp 0.4s ${i * 50}ms both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: act.type === 'expense' ? 'var(--danger-light)' : 'var(--success-light)',
                    color: act.type === 'expense' ? 'var(--danger)' : 'var(--success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {act.type === 'expense' ? <ShoppingBag size={15} /> : <TrendingUp size={15} />}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{act.title}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
                      {new Date(act.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{act.cat}
                    </p>
                  </div>
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: act.type === 'expense' ? 'var(--danger)' : 'var(--success)', flexShrink: 0, marginLeft: '1rem' }}>
                  {act.type === 'expense' ? '-' : '+'}{fmt(act.amount)}
                </p>
              </div>
            )) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Calendar size={22} strokeWidth={1.5} /></div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions + Portfolio Snapshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ animation: 'fadeInUp 0.5s 0.5s both' }}>
            <p className="section-title" style={{ marginBottom: '1rem' }}>Quick Access</p>
            <div className="grid-2" style={{ gap: '0.75rem' }}>
              {[
                { id: 'expenses',    label: 'Expenses',  icon: '💳', desc: 'Track spending' },
                { id: 'investments', label: 'Portfolio', icon: '📈', desc: 'Manage assets' },
                { id: 'emi',         label: 'EMI Calc',  icon: '🏦', desc: 'Loan planner' },
                { id: 'sip',         label: 'SIP Calc',  icon: '💰', desc: 'Wealth builder' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '0.9rem', borderRadius: '14px',
                    background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                    cursor: 'pointer', fontFamily: 'var(--font-family)', transition: 'all 0.2s ease', textAlign: 'left'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--input-bg)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <span style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>{item.icon}</span>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.label}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ animation: 'fadeInUp 0.5s 0.55s both' }}>
            <p className="section-title" style={{ marginBottom: '1rem' }}>Portfolio Snapshot</p>
            {investments.slice(0, 3).map(inv => {
              const ret = Number(inv.investedAmount) > 0
                ? ((inv.currentValue - inv.investedAmount) / inv.investedAmount) * 100 : 0;
              return (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{inv.name}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>{inv.category}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{fmt(inv.currentValue)}</p>
                    <p style={{ fontSize: '0.72rem', color: ret >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600, marginTop: '0.1rem' }}>
                      {ret >= 0 ? '+' : ''}{ret.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
            {investments.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>No investments yet</p>
            )}
            <button onClick={() => setCurrentTab('investments')} className="apple-btn apple-btn-ghost" style={{ width: '100%', marginTop: '0.25rem', justifyContent: 'center' }}>
              View All Holdings <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
