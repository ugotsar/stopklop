// Clés de dates locales. Ne jamais utiliser `toISOString().slice(0, 10)` pour
// une journée utilisateur : en Europe, une saisie après minuit peut sinon être
// rangée la veille car ISO est toujours en UTC.
export function localDateKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(key) {
  const [year, month, day] = String(key).split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addLocalDays(date, amount) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + amount);
  return d;
}
