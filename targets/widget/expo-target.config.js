/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "widget",
  name: "Stopklop",
  icon: "../../assets/icon.png",
  colors: {
    $accent: "#1B6B3A",
  },
  entitlements: {
    "com.apple.security.application-groups": ["group.com.stopklop.app"],
  },
  // Frameworks Apple utilisés par le widget
  frameworks: ["SwiftUI", "WidgetKit"],
};
