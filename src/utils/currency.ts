import { Currency, SalaryPeriod, Language } from '../types/player';

// Standard realistic market exchange rates (Base: EUR)
export const EXCHANGE_RATES: Record<Currency, number> = {
  EUR: 1.0,
  USD: 1.08,
  ILS: 4.05, // 1 EUR = ~4.05 NIS
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  ILS: '₪',
};

export const CURRENCY_LABELS: Record<Language, Record<Currency, string>> = {
  en: {
    EUR: 'EUR (€)',
    USD: 'USD ($)',
    ILS: 'NIS (₪)',
  },
  he: {
    EUR: 'אירו (€)',
    USD: 'דולר ($)',
    ILS: 'שקלים (₪)',
  },
};

export const PERIOD_LABELS: Record<Language, Record<SalaryPeriod, string>> = {
  en: {
    Weekly: '/wk',
    Monthly: '/mo',
    Annual: '/yr',
  },
  he: {
    Weekly: 'לשבוע',
    Monthly: 'לחודש',
    Annual: 'בשנה',
  },
};

/**
 * Converts an amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  from: Currency = 'EUR',
  to: Currency = 'EUR'
): number {
  if (from === to) return amount;
  const inEur = amount / EXCHANGE_RATES[from];
  return Math.round(inEur * EXCHANGE_RATES[to]);
}

/**
 * Formats a salary amount in the target currency with appropriate symbol and period
 */
export function formatSalary(
  amount: number | undefined,
  fromCurrency: Currency = 'EUR',
  displayCurrency: Currency = 'EUR',
  period: SalaryPeriod = 'Weekly',
  language: Language = 'en'
): string {
  if (!amount || isNaN(amount)) return 'N/A';
  
  const converted = convertCurrency(amount, fromCurrency, displayCurrency);
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const formattedNumber = new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US').format(converted);
  const periodLabel = PERIOD_LABELS[language][period];

  if (language === 'he') {
    return `${symbol}${formattedNumber} ${periodLabel}`;
  }
  return `${symbol}${formattedNumber}${periodLabel}`;
}

/**
 * Converts and formats a free-form market value string like "€650,000" or "$400k"
 */
export function convertMarketValueString(
  rawStr: string | undefined,
  displayCurrency: Currency = 'EUR'
): string {
  if (!rawStr) return 'N/A';

  // Detect currency from raw string
  let detectedCurrency: Currency = 'EUR';
  if (rawStr.includes('$')) detectedCurrency = 'USD';
  else if (rawStr.includes('₪') || rawStr.toLowerCase().includes('nis')) detectedCurrency = 'ILS';
  else if (rawStr.includes('£')) detectedCurrency = 'EUR'; // British pound mapped to EUR base

  // Extract digits
  const numericOnly = rawStr.replace(/[^0-9]/g, '');
  if (!numericOnly) return rawStr;

  let baseAmount = parseInt(numericOnly, 10);
  if (rawStr.toLowerCase().includes('k') && baseAmount < 1000) {
    baseAmount *= 1000;
  }

  const converted = convertCurrency(baseAmount, detectedCurrency, displayCurrency);
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  return `${symbol}${new Intl.NumberFormat('en-US').format(converted)}`;
}

/**
 * Parses salary strings like "£1,400" or "€3,200" into numeric and currency
 */
export function parseSalary(
  salaryStr: string | undefined,
  defaultCurrency: Currency = 'EUR'
): { amount: number; currency: Currency; period: SalaryPeriod } {
  if (!salaryStr) {
    return { amount: 2000, currency: defaultCurrency, period: 'Weekly' };
  }

  let currency: Currency = defaultCurrency;
  if (salaryStr.includes('$')) currency = 'USD';
  else if (salaryStr.includes('€')) currency = 'EUR';
  else if (salaryStr.includes('₪') || salaryStr.toLowerCase().includes('nis')) currency = 'ILS';
  else if (salaryStr.includes('£')) currency = 'EUR';

  let period: SalaryPeriod = 'Weekly';
  if (salaryStr.toLowerCase().includes('mo') || salaryStr.includes('חודש')) period = 'Monthly';
  if (salaryStr.toLowerCase().includes('yr') || salaryStr.toLowerCase().includes('ann') || salaryStr.includes('שנה')) period = 'Annual';

  const cleanNum = salaryStr.replace(/[^0-9]/g, '');
  const amount = cleanNum ? parseInt(cleanNum, 10) : 2000;

  return { amount, currency, period };
}
