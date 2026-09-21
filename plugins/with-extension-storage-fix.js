const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

// Le module natif ExtensionStorage (@bacons/apple-targets) declare `platform :ios, '16.4'`
// dans son podspec. L'autolinking Expo ignore SILENCIEUSEMENT tout pod dont la plateforme
// depasse celle du projet (ici iOS 15.1) : le module n'etait donc pas compile dans l'app,
// et les ecritures JS vers l'App Group ne partaient nulle part (widget vide).
// Le code Swift du module n'utilise rien au-dessus de iOS 15 (les API iOS 18 sont deja
// protegees par #available), on aligne donc le podspec sur la cible du projet.
const CIBLE = '15.1';

module.exports = function withExtensionStorageFix(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podspec = path.join(
        cfg.modRequest.projectRoot,
        'node_modules',
        '@bacons',
        'apple-targets',
        'ios',
        'ExtensionStorage.podspec'
      );

      if (!fs.existsSync(podspec)) {
        throw new Error(
          `[extension-storage-fix] podspec introuvable : ${podspec}. Le widget iOS ne recevrait aucune donnee.`
        );
      }

      const source = fs.readFileSync(podspec, 'utf8');
      const patched = source.replace(
        /s\.platform(\s*)=(\s*):ios,\s*'[\d.]+'/,
        `s.platform$1=$2:ios, '${CIBLE}'`
      );

      if (!patched.includes(`:ios, '${CIBLE}'`)) {
        throw new Error(
          "[extension-storage-fix] impossible de patcher ExtensionStorage.podspec (format inattendu)."
        );
      }

      if (patched !== source) {
        fs.writeFileSync(podspec, patched);
      }
      return cfg;
    },
  ]);
};
