export const CURRENCY_INFO = {
  USD: { symbol: '$', locale: 'en-US', name: 'USD ($)' },
  EUR: { symbol: '€', locale: 'de-DE', name: 'EUR (€)' },
  INR: { symbol: '₹', locale: 'en-IN', name: 'INR (₹)' }
};

export const DEFAULT_RATES = {
  USD: 1,
  EUR: 0.92,
  INR: 83.5
};

export async function fetchExchangeRates() {
  const response = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!response.ok) {
    throw new Error('Failed to fetch exchange rates');
  }
  const data = await response.json();
  if (data && data.result === 'success' && data.rates) {
    return {
      USD: 1,
      EUR: Number((data.rates.EUR || DEFAULT_RATES.EUR).toFixed(4)),
      INR: Number((data.rates.INR || DEFAULT_RATES.INR).toFixed(4))
    };
  }
  throw new Error('Invalid response from exchange rate API');
}

export function getCurrencyFormatter(currency) {
  const info = CURRENCY_INFO[currency] || CURRENCY_INFO.USD;
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  });
}

export function getCurrencyFormatterWithDecimals(currency) {
  const info = CURRENCY_INFO[currency] || CURRENCY_INFO.USD;
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatCompact(v, currency) {
  const info = CURRENCY_INFO[currency] || CURRENCY_INFO.USD;
  const symbol = info.symbol;
  if (v >= 1_000_000) return `${symbol}${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${symbol}${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return `${symbol}${v.toFixed(0)}`;
}
