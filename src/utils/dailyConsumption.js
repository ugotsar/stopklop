import { localDateKey } from './dateKeys';

// Fusionne la saisie d'une journée dans le profil. Le nombre saisi est le TOTAL
// de la journée : il remplace la valeur précédente au lieu de s'y ajouter.
export function applyDailyConsumption(
  profile,
  { dateKey = localDateKey(), cigarettes, entries = [], cravings = [] },
  { todayKey = localDateKey(), now = Date.now() } = {},
) {
  const current = profile ?? {};
  const count = Math.max(0, Math.round(Number(cigarettes) || 0));
  const historique = { ...(current.historique ?? {}), [dateKey]: count };
  const existingLog = Array.isArray(current.cigLog) ? current.cigLog : [];
  const cigLog = [
    ...existingLog.filter(ts => localDateKey(ts) !== dateKey),
    ...entries.filter(ts => typeof ts === 'string'),
  ].sort();
  const oldEnvies = Array.isArray(current.envies) ? current.envies : [];
  const existingIds = new Set(oldEnvies.map(item => item.id).filter(Boolean));
  const newCravings = cravings.map((item, index) => ({
    ...item,
    id: item.id ?? `craving_${now}_${index}`,
  })).filter(item => !existingIds.has(item.id));

  return {
    count,
    newCravings,
    profile: {
      ...current,
      historique,
      cigLog,
      envies: [...oldEnvies, ...newCravings],
      cigarettesToday: dateKey === todayKey ? count : (current.cigarettesToday ?? 0),
      lastSavedDate: dateKey === todayKey ? dateKey : current.lastSavedDate,
    },
  };
}

// Horodatages du jour : ceux déjà enregistrés puis les ajouts de la session,
// ajustés au total saisi (un retrait supprime les plus récents).
export function buildDayEntries({ cigLog = [], addedTimes = [], count, todayKey, nowIso = () => new Date().toISOString() }) {
  let entries = (Array.isArray(cigLog) ? cigLog : []).filter(ts => localDateKey(ts) === todayKey).sort();
  entries = [...entries, ...addedTimes];
  if (entries.length > count) entries = entries.slice(0, count);
  while (entries.length < count) entries.push(nowIso());
  return entries;
}

// « Valider ma journée » crée une journée à 0 cigarette seulement si rien n'a
// encore été saisi aujourd'hui ; sinon le total déjà saisi est conservé.
export function validateDayPayload(jourRenseigne, dateKey) {
  return jourRenseigne ? null : { dateKey, cigarettes: 0, entries: [], cravings: [] };
}
