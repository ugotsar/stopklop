// Transformation des réponses de l'onboarding en champs du profil.

export function normalizeConsumption(consoDeclaree, consoUnite) {
  return consoUnite === 'semaine' ? Math.round((consoDeclaree / 7) * 10) / 10 : consoDeclaree;
}

// Accepte « 12,50 » comme « 12.50 ».
export function parsePackPrice(value) {
  return parseFloat(String(value).replace(',', '.'));
}

export function buildOnboardingProfile(answers, existingProfile, now = new Date()) {
  const consoNormalisee = normalizeConsumption(answers.consoDeclaree, answers.consoUnite);
  const prixNum = parsePackPrice(answers.prixPaquet);
  const objectifFinal = answers.typeObjectif === 'stop' ? 0 : answers.objectifQuotidien;
  const nowIso = now.toISOString();
  const debutISO = new Date(answers.dateDebut + 'T00:00:00').toISOString();

  return {
    // Identification (3 affirmations oui/non)
    identification: {
      echecPasse:  answers.identification[0],
      automatisme: answers.identification[1],
      perduMethode: answers.identification[2],
    },
    // Objectif & consommation
    typeObjectif: answers.typeObjectif,             // 'reduce' | 'stop'
    consoDeclaree: answers.consoDeclaree,
    consoUnite: answers.consoUnite,                  // 'jour' | 'semaine'
    consoAvantApp: consoNormalisee,                  // référence quotidienne normalisée
    consoAvantDeclaree: true,
    objectifCigarettes: objectifFinal,
    reductionParSemaine: answers.typeObjectif === 'reduce' ? 2 : null,
    planStartDate: answers.typeObjectif === 'reduce' ? debutISO : null,
    // Budget
    cigarettesParPaquet: answers.cigarettesParPaquet,
    prixPaquet: Math.round(prixNum * 100) / 100,
    monnaie: answers.monnaie,                        // code ISO 4217
    // Dates
    dateArretSouhaitee: debutISO,
    startDate: debutISO,
    createdAt: existingProfile?.createdAt ?? nowIso,
    // Motivations
    motivations: answers.motivations,                // identifiants stables
    motivationPerso: answers.motivationPerso.trim() || null,
    niveauMotivation: answers.niveauMotivation,
    // Statut
    onboardingComplete: true,
    onboardingCompletedAt: nowIso,
  };
}
