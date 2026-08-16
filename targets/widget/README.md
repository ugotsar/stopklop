# Widget iOS — Stopklop

Widget d'écran d'accueil (WidgetKit / SwiftUI) affichant les données de
l'utilisateur : argent économisé, cigarettes du jour et évolution sur 7 jours.

## Architecture

Un widget iOS ne peut pas interroger Firestore directement (extension isolée,
budget mémoire/temps limité). Le flux est donc :

```
App RN  ──(computeStats)──►  services/widget.js
                                   │  setWidgetData(JSON)
                                   ▼
                    Module natif StopklopWidget (Swift)
                                   │  écrit dans l'App Group
                                   ▼
                UserDefaults(suiteName: "group.com.stopklop.app")
                                   │  reloadAllTimelines()
                                   ▼
                    targets/widget/index.swift  ──►  affichage
```

- `modules/stopklop-widget/` : module natif local (pont JS → App Group + reload).
- `src/services/widget.js` : construit l'instantané depuis les stats et l'envoie
  (no-op sur Android / web / Expo Go).
- `src/context/UserContext.js` : appelle `syncWidget()` à chaque changement de profil.
- `targets/widget/index.swift` : le widget (tailles small / medium / large).

## Instantané envoyé (clé `stopklopWidget`)

```json
{
  "savingsTotal": 248.5,
  "currency": "€",
  "cigsToday": 6,
  "objectifJour": 6,
  "week": [{ "label": "Lun", "value": 14 }, ...7 jours],
  "updatedAt": 1690000000000
}
```

## Installation / build (à faire sur macOS)

Le widget est du code natif iOS : il ne fonctionne **ni dans Expo Go, ni sur le
web**. Il faut un build de développement (dev client) ou EAS.

1. Installer la dépendance du plugin :
   ```bash
   npm install
   ```
2. Générer le projet natif :
   ```bash
   npx expo prebuild -p ios --clean
   ```
   Le plugin `@bacons/apple-targets` crée l'extension widget à partir de
   `targets/widget/`, et l'App Group est ajouté à l'app et au widget.
3. Vérifier dans Xcode que l'App Group `group.com.stopklop.app` est bien activé
   sur la cible **app** ET la cible **widget** (Signing & Capabilities). Il doit
   aussi exister dans le portail Apple Developer (Identifiers → App Groups).
4. Lancer sur un appareil / simulateur :
   ```bash
   npx expo run:ios
   ```
   ou un build EAS : `eas build -p ios --profile development`.
5. Ouvrir l'app une fois (elle écrit les données), puis ajouter le widget :
   appui long sur l'écran d'accueil → **+** → Stopklop.

## Notes

- Bundle identifier de l'app : `com.stopklop.app`. Le widget hérite d'un suffixe
  (ex. `com.stopklop.app.widget`) géré par le plugin.
- Si tu changes le nom de l'App Group, mets-le à jour aux 4 endroits :
  `app.json`, `targets/widget/expo-target.config.js`,
  `targets/widget/index.swift`, `modules/stopklop-widget/ios/StopklopWidgetModule.swift`.
- Les couleurs reprennent l'identité verte (#1B6B3A).
