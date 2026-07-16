/**
 * chartUtils.js
 * Shared helpers for all Chart.js charts in Finova.
 * Resolves CSS custom properties at runtime so charts look
 * correct in both light and dark mode.
 */

/**
 * Read a CSS variable from :root at call-time (not compile-time).
 * @param {string} varName  e.g. '--text-secondary'
 * @param {string} fallback
 */
export function cssVar(varName, fallback = '') {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim() || fallback;
}

/**
 * Build a vertical linear gradient for a chart canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} chartArea  { top, bottom }
 * @param {string} colorTop   rgba / hex
 * @param {string} colorBottom
 */
export function buildGradient(ctx, chartArea, colorTop, colorBottom) {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, colorTop);
  gradient.addColorStop(1, colorBottom);
  return gradient;
}

/**
 * Canonical tooltip style config — resolved at call time.
 */
export function tooltipDefaults() {
  return {
    enabled: true,
    backgroundColor: cssVar('--bg-secondary', '#fff'),
    titleColor: cssVar('--text-primary', '#1c1c1e'),
    bodyColor: cssVar('--text-secondary', '#6c6c70'),
    borderColor: cssVar('--border-strong', 'rgba(0,0,0,.12)'),
    borderWidth: 1,
    padding: { x: 14, y: 10 },
    cornerRadius: 12,
    boxPadding: 6,
    titleFont: { family: 'Outfit', size: 12, weight: '600' },
    bodyFont:  { family: 'Outfit', size: 12 },
    displayColors: true,
    boxWidth: 10,
    boxHeight: 10,
    usePointStyle: true,
  };
}

/**
 * Canonical axis style — resolved at call time.
 */
export function axisDefaults(options = {}) {
  const tickColor = cssVar('--text-tertiary', '#aeaeb2');
  const gridColor = cssVar('--border-color', 'rgba(0,0,0,.06)');
  return {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: tickColor,
        font: { family: 'Outfit', size: 11 },
        maxRotation: 0,
        ...options.xTicks,
      },
    },
    y: {
      grid: {
        color: gridColor,
        drawBorder: false,
        lineWidth: 1,
      },
      border: { display: false, dash: [4, 4] },
      ticks: {
        color: tickColor,
        font: { family: 'Outfit', size: 11 },
        maxTicksLimit: 6,
        ...options.yTicks,
      },
    },
  };
}

/** Format value as compact currency, e.g. $1.2k, $45k */
export function fmtK(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return `$${v.toFixed(0)}`;
}

/** Format full currency */
export function fmtFull(v) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(v);
}

/**
 * Chart.js plugin: draws a center label inside a doughnut/pie.
 * Register with ChartJS.register(doughnutCenterLabel)
 */
export const doughnutCenterLabel = {
  id: 'doughnutCenterLabel',
  afterDraw(chart) {
    const { ctx, chartArea, data } = chart;
    if (chart.config.type !== 'doughnut') return;
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const total = (data.datasets[0]?.data || []).reduce((a, b) => a + b, 0);
    if (!total) return;

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    // Value
    ctx.font = `700 1.05rem Outfit, sans-serif`;
    ctx.fillStyle = cssVar('--text-primary', '#1c1c1e');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const pluginOpts = chart.config.options.plugins?.doughnutCenterLabel;
    let text = '';
    if (pluginOpts && typeof pluginOpts.format === 'function') {
      text = pluginOpts.format(total);
    } else {
      text = fmtFull(total);
    }

    ctx.fillText(text, centerX, centerY - 9);
    // Label
    ctx.font = `400 0.65rem Outfit, sans-serif`;
    ctx.fillStyle = cssVar('--text-tertiary', '#aeaeb2');
    ctx.fillText('Total', centerX, centerY + 11);
    ctx.restore();
  },
};
