export function formatCurrency(amount, currency = 'EUR', locale = 'fr-FR', options = {}) {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: options.minimumFractionDigits ?? 2,
      maximumFractionDigits: options.maximumFractionDigits ?? 2,
    }).format(value);
  } catch (_) {
    return `${value.toFixed(options.maximumFractionDigits ?? 2)} ${currency || 'EUR'}`;
  }
}

export function currencySymbol(currency = 'EUR', locale = 'fr-FR') {
  return formatCurrency(0, currency, locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    .replace(/[\d\s.,\-]/g, '')
    .trim() || currency;
}
