import ExpoModulesCore
import WidgetKit

// Pont natif : écrit l'instantané des données de l'utilisateur dans l'App Group
// partagé avec le widget, puis force le rafraîchissement du widget.
public class StopklopWidgetModule: Module {
  private let appGroup = "group.com.stopklop.app"
  private let storeKey = "stopklopWidget"

  public func definition() -> ModuleDefinition {
    Name("StopklopWidget")

    // setData(jsonString) : appelé depuis le JS avec l'instantané sérialisé.
    Function("setData") { (json: String) in
      let defaults = UserDefaults(suiteName: self.appGroup)
      defaults?.set(json, forKey: self.storeKey)
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }

    // reload() : force un rafraîchissement sans changer les données.
    Function("reload") {
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
