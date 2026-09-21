// Visite guidée « Klop te guide ». L'étape 0 est l'écran de bienvenue plein
// écran ; les suivantes posent une bulle sur un élément réel de l'app.
// `route` : arguments de navigation.navigate ; `target` : id enregistré via
// useTourTarget ; `scroll` : nom du ScrollView à faire défiler (useTourScroll).
export const TOUR_STEPS = [
  { key: 'welcome' },
  { key: 'smokedLink', route: ['MainTabs', { screen: 'Accueil' }], target: 'home.smokedLink', scroll: 'Accueil' },
  { key: 'dailyTotal', route: ['JaiFume'], target: 'jaifume.counter', scroll: 'JaiFume' },
  { key: 'efforts', route: ['MainTabs', { screen: 'Statistiques' }], target: 'stats.grid', scroll: 'Statistiques' },
  { key: 'periods', route: ['MainTabs', { screen: 'Statistiques' }], target: 'stats.tabs' },
  { key: 'habits', route: ['MainTabs', { screen: 'Plan' }], target: 'plan.habits', scroll: 'Plan' },
  { key: 'plan', route: ['MainTabs', { screen: 'Plan' }], target: 'plan.modify', scroll: 'Plan' },
  { key: 'choice', route: ['ModifierObjectif'], target: 'objectif.choices', scroll: 'ModifierObjectif' },
  { key: 'finish', route: ['ModifierObjectif'], target: 'objectif.save', scroll: 'ModifierObjectif' },
  // Plein écran, sans cible : présentation du widget d'écran d'accueil.
  { key: 'widget' },
];
