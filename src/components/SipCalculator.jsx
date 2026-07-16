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

/* ── shared slider ── */
function SliderField({ label, value, onChange, min, max, step, unit = '', displayValue }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label className="apple-label" style={{ margin: 0 }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="number" step={step} value={value}
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

export default function SipCalculator({ currency, rate: exchangeRate, fmt, fmtK }) {
  const [monthly, setMonthly] = useState(2500);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(15);

  const symbol = CURRENCY_INFO[currency]?.symbol || '$';

  const calc = useMemo(() => {
    const P = monthly;
    const i = rate / 100 / 12; // monthly interest rate
    const n = years * 12; // monthly periods

    let future = 0;
    if (i > 0) {
      future = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    } else {
      future = P * n;
    }

    const invested = P * n;
    const wealth = Math.max(0, future - invested);

    // schedule of values (yearly)
    const schedule = [];
    for (let y = 1; y <= years; y++) {
      const ny = y * 12;
      let val = 0;
      if (i > 0) {
        val = P * ((Math.pow(1 + i, ny) - 1) / i) * (1 + i);
      } else {
        val = P * ny;
      }
      schedule.push({
        year: y,
        invested: P * ny,
        value: Math.round(val),
        wealth: Math.round(Math.max(0, val - (P * ny)))
      });
    }

    return { future: Math.round(future), invested, wealth, schedule };
  }, [monthly, rate, years]);

  const returns = calc.invested > 0 ? (calc.wealth / calc.invested) * 100 : 0;

  /* ── Doughnut ── */
  const donutData = {
    labels: ['Invested Capital', 'Wealth Gain'],
    datasets: [{
      data: [calc.invested, calc.wealth],
      backgroundColor: ['#0a84ff' + 'e6', '#30d158' + 'e6'],
      hoverBackgroundColor: ['#0a84ff', '#30d158'],
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

  /* ── Growth line chart ── */
  const lineLabels = ['Start', ...calc.schedule.map(s => `Yr ${s.year}`)];
  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Portfolio Value',
        data: [0, ...calc.schedule.map(s => s.value)],
        borderColor: '#30d158',
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          if (!chart.chartArea) return 'transparent';
          return buildGradient(chart.ctx, chart.chartArea, 'rgba(48,209,88,0.22)', 'rgba(48,209,88,0.00)');
        },
        fill: true,
        borderWidth: 2.5,
        tension: 0.42,
        pointRadius: 0,
        pointHitRadius: 20,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#30d158',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
      {
        label: 'Amount Invested',
        data: [0, ...calc.schedule.map(s => s.invested)],
        borderColor: '#0a84ff',
        backgroundColor: 'transparent',
        fill: false,
        borderWidth: 2,
        tension: 0.42,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHitRadius: 20,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#0a84ff',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };
  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    animation: { duration: 900, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: cssVar('--text-secondary', '#6c6c70'),
          font: { family: 'Outfit', size: 11 },
          boxWidth: 24, boxHeight: 2,
          padding: 16,
          usePointStyle: false,
        }
      },
      tooltip: {
        ...tooltipDefaults(),
        callbacks: {
          title: items => items[0].label,
          label: ctx => `  ${ctx.dataset.label}  ${fmt(ctx.raw)}`,
          afterBody: (items) => {
            const val = items.find(i => i.datasetIndex === 0)?.raw || 0;
            const inv = items.find(i => i.datasetIndex === 1)?.raw || 0;
            const gain = val - inv;
            return [``, `  Gain  +${fmt(gain)}`];
          },
        },
      },
    },
    scales: { ...axisDefaults({ yTicks: { callback: fmtK } }) },
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">SIP Calculator</h1>
        <p className="page-subtitle">Visualize your wealth growth with systematic investing</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* ── Sliders ── */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <SliderField label="Monthly Investment" value={monthly} onChange={setMonthly} min={100} max={100000} step={100} displayValue={v => `${symbol}${(v/1000).toFixed(0)}K`} />
          <SliderField label="Expected Annual Return" value={rate} onChange={setRate} min={1} max={30} step={0.5} unit="%" />
          <SliderField label="Investment Period" value={years} onChange={setYears} min={1} max={40} step={1} unit=" yrs" />

          {/* Insight pill */}
          <div style={{ padding: '1rem', borderRadius: 14, background: 'var(--success-light)', border: '1px solid rgba(48,209,88,0.2)' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Returns Insight</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
              Your capital grows <strong style={{ color: 'var(--success)' }}>{returns.toFixed(0)}%</strong> over {years} yr{years > 1 ? 's' : ''}, turning <strong>{fmt(monthly)}/mo</strong> into <strong style={{ color: 'var(--success)' }}>{fmt(calc.future)}</strong>.
            </p>
          </div>
        </div>

        {/* ── Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="grid-3" style={{ gap: '0.75rem' }}>
            {[
              { label: 'Total Invested', value: fmt(calc.invested), color: 'var(--accent-color)' },
              { label: 'Wealth Gained',  value: fmt(calc.wealth),   color: 'var(--success)' },
              { label: 'Future Value',   value: fmt(calc.future),   color: 'var(--text-primary)' },
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
              <p className="section-title">Wealth Growth Projection</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Year-by-year compounding</p>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <Line data={lineData} options={lineOpts} />
          </div>
        </div>

        <div className="glass-panel" style={{ animation: 'fadeInUp 0.4s 0.3s both', display: 'flex', flexDirection: 'column' }}>
          <p className="section-title" style={{ marginBottom: '1.25rem' }}>Yearly Projection</p>
          <div className="apple-table-container" style={{ flex: 1, overflowY: 'auto', maxHeight: 260 }}>
            <table className="apple-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Invested</th>
                  <th>Gains</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {calc.schedule.map(s => (
                  <tr key={s.year}>
                    <td style={{ color: 'var(--text-secondary)' }}>Yr {s.year}</td>
                    <td style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{fmt(s.invested)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(s.wealth)}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{fmt(s.value)}</td>
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
