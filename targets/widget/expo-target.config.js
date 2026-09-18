/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'StopklopWidget',
  displayName: 'Stopklop',
  deploymentTarget: '15.1',
  colors: {
    $accent: '#2F7A44',
    $widgetBackground: '#FFFDF8',
  },
  images: {
    cible: '../../assets/ui-kit/cible_fleche_feuillue_3d.png',
    portefeuille: '../../assets/ui-kit/portefeuille_euros_feuilles_3d.png',
    sablier: '../../assets/ui-kit/sablier_bois_feuilles_3d.png',
  },
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
  frameworks: ['SwiftUI', 'WidgetKit'],
});
