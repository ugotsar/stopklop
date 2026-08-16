import WidgetKit
import SwiftUI

// ─────────────────────────────────────────────────────────────────────────────
//  Stopklop — Widget d'écran d'accueil (iOS)
//
//  Les données affichées proviennent de l'App Group "group.com.stopklop.app".
//  L'application y écrit un instantané des données Firestore de l'utilisateur
//  (module natif StopklopWidget) et rafraîchit le widget.
// ─────────────────────────────────────────────────────────────────────────────

let APP_GROUP = "group.com.stopklop.app"
let STORE_KEY = "stopklopWidget"

// MARK: - Modèle de données partagé

struct DayBar: Codable, Identifiable {
  var id: String { label }
  let label: String
  let value: Int
}

struct WidgetData: Codable {
  let savingsTotal: Double
  let currency: String
  let cigsToday: Int
  let objectifJour: Int
  let week: [DayBar]
  let updatedAt: Double

  static let placeholder = WidgetData(
    savingsTotal: 248.5, currency: "€", cigsToday: 6, objectifJour: 6,
    week: [
      .init(label: "Lun", value: 14), .init(label: "Mar", value: 12),
      .init(label: "Mer", value: 10), .init(label: "Jeu", value: 8),
      .init(label: "Ven", value: 7),  .init(label: "Sam", value: 6),
      .init(label: "Dim", value: 6),
    ],
    updatedAt: 0)
}

func loadWidgetData() -> WidgetData {
  guard
    let defaults = UserDefaults(suiteName: APP_GROUP),
    let raw = defaults.string(forKey: STORE_KEY),
    let data = raw.data(using: .utf8),
    let decoded = try? JSONDecoder().decode(WidgetData.self, from: data)
  else { return .placeholder }
  return decoded
}

// MARK: - Timeline

struct StopklopEntry: TimelineEntry {
  let date: Date
  let data: WidgetData
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> StopklopEntry {
    StopklopEntry(date: Date(), data: .placeholder)
  }
  func getSnapshot(in context: Context, completion: @escaping (StopklopEntry) -> Void) {
    let data = context.isPreview ? .placeholder : loadWidgetData()
    completion(StopklopEntry(date: Date(), data: data))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<StopklopEntry>) -> Void) {
    let entry = StopklopEntry(date: Date(), data: loadWidgetData())
    // Rafraîchissement de secours dans 1 h ; l'app force aussi un reload à chaque
    // changement de données (WidgetCenter.reloadAllTimelines()).
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

// MARK: - Palette (identité Stopklop)

extension Color {
  static let skBrand     = Color(red: 0.106, green: 0.420, blue: 0.227) // #1B6B3A
  static let skBrandSoft = Color(red: 0.639, green: 0.816, blue: 0.702) // barres claires
  static let skTint      = Color(red: 0.910, green: 0.960, blue: 0.933) // #E8F5EE
  static let skCard      = Color(red: 0.937, green: 0.965, blue: 0.945)
  static let skInk       = Color(red: 0.078, green: 0.125, blue: 0.102)
  static let skGray      = Color(red: 0.420, green: 0.459, blue: 0.435)
}

func formatMoney(_ value: Double, currency: String) -> String {
  let f = NumberFormatter()
  f.numberStyle = .decimal
  f.locale = Locale(identifier: "fr_FR")
  f.minimumFractionDigits = 2
  f.maximumFractionDigits = 2
  let n = f.string(from: NSNumber(value: value)) ?? "0,00"
  return "\(n) \(currency)"
}

// MARK: - Composants

/// Carte statistique (icône ronde + libellé + valeur)
struct StatCard<Icon: View, Content: View>: View {
  let icon: Icon
  let content: Content
  init(@ViewBuilder icon: () -> Icon, @ViewBuilder content: () -> Content) {
    self.icon = icon()
    self.content = content()
  }
  var body: some View {
    HStack(spacing: 12) {
      ZStack {
        Circle().fill(Color.white)
        icon
      }
      .frame(width: 46, height: 46)
      content
      Spacer(minLength: 0)
    }
    .padding(12)
    .background(Color.skTint)
    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
  }
}

/// Graphique à barres des 7 derniers jours (dernière barre = aujourd'hui, plus foncée)
struct BarChart: View {
  let week: [DayBar]
  var maxValue: Int { max(week.map { $0.value }.max() ?? 1, 1) }

  var body: some View {
    GeometryReader { geo in
      let count = max(week.count, 1)
      let slot = geo.size.width / CGFloat(count)
      let barW = min(slot * 0.5, 22)
      let chartH = geo.size.height - 22 // place pour la valeur au-dessus + le label

      HStack(alignment: .bottom, spacing: 0) {
        ForEach(Array(week.enumerated()), id: \.element.id) { idx, day in
          let isToday = idx == week.count - 1
          let h = chartH * CGFloat(day.value) / CGFloat(maxValue)
          VStack(spacing: 4) {
            Text("\(day.value)")
              .font(.system(size: 12, weight: .semibold))
              .foregroundColor(.skInk)
            RoundedRectangle(cornerRadius: 6, style: .continuous)
              .fill(
                LinearGradient(
                  colors: isToday
                    ? [Color.skBrand, Color.skBrand]
                    : [Color.skBrandSoft.opacity(0.9), Color.skBrandSoft.opacity(0.45)],
                  startPoint: .bottom, endPoint: .top)
              )
              .frame(width: barW, height: max(h, 3))
            Text(day.label)
              .font(.system(size: 11, weight: .medium))
              .foregroundColor(.skGray)
          }
          .frame(width: slot)
        }
      }
    }
  }
}

// MARK: - Vues par taille

struct HeaderView: View {
  var body: some View {
    HStack(spacing: 10) {
      RoundedRectangle(cornerRadius: 11, style: .continuous)
        .fill(Color.skBrand)
        .frame(width: 34, height: 34)
        .overlay(
          Text("S").font(.system(size: 20, weight: .heavy)).foregroundColor(.white)
        )
      Text("Stopklop")
        .font(.system(size: 22, weight: .heavy))
        .foregroundColor(.skBrand)
    }
  }
}

struct SavingsContent: View {
  let data: WidgetData
  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text("Économisé depuis\nl'installation")
        .font(.system(size: 13, weight: .regular))
        .foregroundColor(.skGray)
        .fixedSize(horizontal: false, vertical: true)
      Text(formatMoney(data.savingsTotal, currency: data.currency))
        .font(.system(size: 22, weight: .heavy))
        .foregroundColor(.skBrand)
        .minimumScaleFactor(0.6)
        .lineLimit(1)
    }
  }
}

struct TodayContent: View {
  let data: WidgetData
  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      Text("Consommation")
        .font(.system(size: 13)).foregroundColor(.skGray)
      Text("\(data.cigsToday)")
        .font(.system(size: 26, weight: .heavy)).foregroundColor(.skBrand)
      Text("cigarettes aujourd'hui")
        .font(.system(size: 12)).foregroundColor(.skGray)
        .fixedSize(horizontal: false, vertical: true)
    }
  }
}

/// Grand widget : reproduit le design complet
struct LargeView: View {
  let data: WidgetData
  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HeaderView()

      HStack(spacing: 10) {
        StatCard(icon: {
          Image(systemName: "eurosign.circle.fill")
            .font(.system(size: 24)).foregroundColor(.skBrand)
        }, content: { SavingsContent(data: data) })
        StatCard(icon: {
          Image(systemName: "smoke.fill")
            .font(.system(size: 22)).foregroundColor(.skBrand)
        }, content: { TodayContent(data: data) })
      }

      VStack(alignment: .leading, spacing: 8) {
        HStack {
          Image(systemName: "chart.line.uptrend.xyaxis")
            .font(.system(size: 15, weight: .bold)).foregroundColor(.skBrand)
          Text("Évolution de la consommation")
            .font(.system(size: 15, weight: .bold)).foregroundColor(.skInk)
          Spacer()
          Text("7 jours")
            .font(.system(size: 12, weight: .medium)).foregroundColor(.skGray)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(Color.skCard)
            .clipShape(Capsule())
        }
        BarChart(week: data.week)
      }
      .padding(12)
      .background(
        RoundedRectangle(cornerRadius: 16, style: .continuous)
          .stroke(Color.skCard, lineWidth: 1)
      )

      HStack(spacing: 10) {
        ZStack {
          Circle().fill(Color.skTint).frame(width: 34, height: 34)
          Image(systemName: "leaf.fill").font(.system(size: 15)).foregroundColor(.skBrand)
        }
        VStack(alignment: .leading, spacing: 1) {
          Text("Continuez, vous êtes sur la bonne voie !")
            .font(.system(size: 14, weight: .bold)).foregroundColor(.skBrand)
          Text("Chaque cigarette en moins compte.")
            .font(.system(size: 12)).foregroundColor(.skGray)
        }
        Spacer(minLength: 0)
      }
    }
  }
}

/// Widget moyen : deux stats + mini graphique
struct MediumView: View {
  let data: WidgetData
  var body: some View {
    HStack(spacing: 12) {
      VStack(alignment: .leading, spacing: 10) {
        HeaderView()
        SavingsContent(data: data)
        TodayContent(data: data)
        Spacer(minLength: 0)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      BarChart(week: data.week)
        .frame(maxWidth: .infinity)
    }
  }
}

/// Petit widget : économies + cigarettes du jour
struct SmallView: View {
  let data: WidgetData
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 6) {
        RoundedRectangle(cornerRadius: 7, style: .continuous)
          .fill(Color.skBrand).frame(width: 22, height: 22)
          .overlay(Text("S").font(.system(size: 13, weight: .heavy)).foregroundColor(.white))
        Text("Stopklop").font(.system(size: 14, weight: .heavy)).foregroundColor(.skBrand)
      }
      Spacer(minLength: 0)
      Text("Économisé").font(.system(size: 12)).foregroundColor(.skGray)
      Text(formatMoney(data.savingsTotal, currency: data.currency))
        .font(.system(size: 20, weight: .heavy)).foregroundColor(.skBrand)
        .minimumScaleFactor(0.6).lineLimit(1)
      Spacer(minLength: 0)
      HStack(spacing: 4) {
        Image(systemName: "smoke.fill").font(.system(size: 12)).foregroundColor(.skGray)
        Text("\(data.cigsToday) aujourd'hui").font(.system(size: 13, weight: .semibold)).foregroundColor(.skInk)
      }
    }
  }
}

// MARK: - Vue racine + fond conteneur

struct ContainerBackground: ViewModifier {
  func body(content: Content) -> some View {
    if #available(iOS 17.0, *) {
      content.containerBackground(Color.white, for: .widget)
    } else {
      content.padding(16).background(Color.white)
    }
  }
}

struct StopklopWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: StopklopEntry
  var body: some View {
    Group {
      switch family {
      case .systemSmall:  SmallView(data: entry.data)
      case .systemMedium: MediumView(data: entry.data)
      default:            LargeView(data: entry.data)
      }
    }
    .modifier(ContainerBackground())
  }
}

// MARK: - Déclaration du widget

struct StopklopWidget: Widget {
  let kind = "StopklopWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      StopklopWidgetView(entry: entry)
    }
    .configurationDisplayName("Stopklop")
    .description("Vos économies et votre consommation en un coup d'œil.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}

@main
struct StopklopWidgetBundle: WidgetBundle {
  var body: some Widget {
    StopklopWidget()
  }
}
