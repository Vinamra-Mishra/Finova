import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  cssVar, buildGradient, tooltipDefaults, axisDefaults,
  doughnutCenterLabel
} from '../utils/chartUtils';
import { CURRENCY_INFO } from '../utils/currency';

ChartJS.register(
  ArcElement, Tooltip, Legend, doughnutCenterLabel,
  CategoryScale, LinearScale, PointElement, LineElement, Filler
);

/* ── shared slider component ── */
function SliderField({ label, value, onChange, min, max, step, unit = '', displayValue }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label className="apple-label" style={{ margin: 0 }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="number" value={value}
            onChange={e => onChange(Number(e.target.value))}
            style={{
              width: 90, padding: '0.3rem 0.5rem', textAlign: 'right', borderRadius: 8,
              border: '1px solid var(--border-color)', background: 'var(--input-bg)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-family)', fontSize: '0.9rem', outline: 'none'
            }}
          />
          {unit && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{unit}</span>}
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '-0.5rem' }}>
        <span>{displayValue ? displayValue(min) : `${min}${unit}`}</span>
        <span>{displayValue ? displayValue(max) : `${max}${unit}`}</span>
      </div>
    </div>
  );
}

export default function EmiCalculator({ currency, rate, fmt, fmtK }) {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [interestRate, setInterestRate] = useState(7.5);
  const [tenure, setTenure] = useState(15);
  const [tenureType, setTenureType] = useState('years'); // 'years' or 'months'

  const symbol = CURRENCY_INFO[currency]?.symbol || '$';

  const tenureMonths = tenureType === 'years' ? tenure * 12 : tenure;

  const calc = useMemo(() => {
    const r = interestRate / 1200; // monthly rate
    const n = tenureMonths;
    let emi = 0;
    if (r > 0) {
      emi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else {
      emi = loanAmount / n;
    }
    const total = emi * n;
    const interest = total - loanAmount;

    // repayment schedule (yearly summary)
    const schedule = [];
    let balance = loanAmount;
    let cumPrincipal = 0;
    let cumInterest = 0;

    for (let m = 1; m <= n; m++) {
      const interestPaid = balance * r;
      const principalPaid = emi - interestPaid;
      balance -= principalPaid;
      cumPrincipal += principalPaid;
      cumInterest += interestPaid;

      if (m % 12 === 0 || m === n) {
        schedule.push({
          year: Math.ceil(m / 12),
          cumPrincipal: Math.round(cumPrincipal),
          cumInterest: Math.round(cumInterest),
          balance: Math.max(0, Math.round(balance)),
        });
      }
    }

    return { emi: Math.round(emi), total: Math.round(total), interest: Math.round(interest), schedule };
  }, [loanAmount, interestRate, tenureMonths]);

  /* ── Doughnut ── */
  const donutData = {
    labels: ['Principal', 'Total Interest'],
    datasets: [{
      data: [loanAmount, calc.interest],
      backgroundColor: ['#0a84ff' + 'e6', '#ff9f0a' + 'e6'],
      hoverBackgroundColor: ['#0a84ff', '#ff9f0a'],
      borderColor: cssVar('--bg-secondary', '#fff'),
      borderWidth: 3,
      hoverOffset: 6,
    }],
  };
  const donutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    animation: { animateRotate: true, duration: 800, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: cssVar('--text-secondary', '#6c6c70'), font: { family: 'Outfit', size: 11 }, boxWidth: 10, boxHeight: 10, padding: 16, usePointStyle: true, pointStyleWidth: 10 }
      },
      tooltip: { ...tooltipDefaults(), callbacks: { label: ctx => `  ${ctx.label}  ${fmt(ctx.raw)}` } },
      doughnutCenterLabel: {
        format: fmt
      },
    },
  };

  /* ── Balance over time line ── */
  const lineLabels = ['Start', ...calc.schedule.map(s => `Yr ${s.year}`)];
  const lineValues = [loanAmount, ...calc.schedule.map(s => s.balance)];

  const lineData = {
    labels: lineLabels,
    datasets: [{
      label: 'Outstanding Balance',
      data: lineValues,
      borderColor: '#0a84ff',
      backgroundColor: (ctx) => {
        const { chart } = ctx;
        if (!chart.chartArea) return 'transparent';
        return buildGradient(chart.ctx, chart.chartArea, 'rgba(10,132,255,0.22)', 'rgba(10,132,255,0.00)');
      },
      fill: true,
      borderWidth: 2.5,
      tension: 0.38,
      pointRadius: 0,
      pointHitRadius: 20,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#0a84ff',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    }],
  };
  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    animation: { duration: 800, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipDefaults(),
        callbacks: {
          title: items => items[0].label,
          label: ctx => `  Balance  ${fmt(ctx.raw)}`,
        },
      },
    },
    scales: { ...axisDefaults({ yTicks: { callback: fmtK } }) },
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">EMI Calculator</h1>
        <p className="page-subtitle">Plan your loan repayments with confidence</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* ── Sliders ── */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <SliderField
            label="Loan Amount" value={loanAmount} onChange={setLoanAmount}
            min={1000} max={1000000} step={1000}
            displayValue={v => `${symbol}${(v / 1000).toFixed(0)}K`}
          />
          <SliderField
            label="Interest Rate (p.a.)" value={interestRate} onChange={setInterestRate}
            min={1} max={20} step={0.1} unit="%"
          />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="apple-label" style={{ margin: 0 }}>Loan Tenure</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number" value={tenure}
                  onChange={e => setTenure(Number(e.target.value))}
                  style={{ width: 64, padding: '0.3rem 0.5rem', textAlign: 'right', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', fontSize: '0.9rem', outline: 'none' }}
                />
                <div className="seg-control">
                  <button className={`seg-btn ${tenureType === 'years' ? 'active' : ''}`} onClick={() => { setTenureType('years'); if (tenureType === 'months') setTenure(Math.max(1, Math.round(tenure / 12))); }}>Yr</button>
                  <button className={`seg-btn ${tenureType === 'months' ? 'active' : ''}`} onClick={() => { setTenureType('months'); if (tenureType === 'years') setTenure(tenure * 12); }}>Mo</button>
                </div>
              </div>
            </div>
            <input type="range" min="1" max={tenureType === 'years' ? 30 : 360} step="1" value={tenure} onChange={e => setTenure(Number(e.target.value))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '-0.5rem' }}>
              <span>1 {tenureType === 'years' ? 'yr' : 'mo'}</span>
              <span>{tenureType === 'years' ? '30 yrs' : '360 mos'}</span>
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="grid-3" style={{ gap: '0.75rem' }}>
            {[
              { label: 'Monthly EMI',    value: fmt(calc.emi),      color: 'var(--accent-color)' },
              { label: 'Total Interest', value: fmt(calc.interest), color: 'var(--warning)' },
              { label: 'Total Payable',  value: fmt(calc.total),    color: 'var(--text-primary)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                <p className="metric-label">{label}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color, marginTop: '0.35rem' }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: 210 }}>
              <Doughnut data={donutData} options={donutOpts} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>

        <div className="glass-panel" style={{ animation: 'fadeInUp 0.4s 0.2s both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <p className="section-title">Loan Balance Over Time</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Yearly outstanding balance</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ width: 28, height: 3, borderRadius: 2, background: '#0a84ff' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Balance</span>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <Line data={lineData} options={lineOpts} />
          </div>
        </div>

        <div className="glass-panel" style={{ animation: 'fadeInUp 0.4s 0.3s both', display: 'flex', flexDirection: 'column' }}>
          <p className="section-title" style={{ marginBottom: '1.25rem' }}>Yearly Breakdown</p>
          <div className="apple-table-container" style={{ flex: 1, overflowY: 'auto', maxHeight: 260 }}>
            <table className="apple-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {calc.schedule.map(s => (
                  <tr key={s.year}>
                    <td style={{ color: 'var(--text-secondary)' }}>Yr {s.year}</td>
                    <td style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{fmt(s.cumPrincipal)}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{fmt(s.cumInterest)}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{fmt(s.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
