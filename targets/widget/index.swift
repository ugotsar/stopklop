import WidgetKit
import SwiftUI

// Widget « Bilan » : les chiffres du jour, les cigarettes des 7 derniers jours
// face à l'objectif, les économies de la semaine et un bouton « J'ai fumé ».
// L'app écrit l'instantané dans l'App Group (src/widget/syncWidget.ios.js).

let appGroup = "group.com.stopklop.app"
let storeKey = "stopklopWidget"

// MARK: - Données

struct Snapshot: Codable {
  struct Day: Codable { let label: String; let value: Int?; let goal: Int }
  struct Labels: Codable {
    let today: String; let smoked: String; let cigarettes: String
    let saved: String; let life: String; let thisWeek: String; let goal: String
    // Ajoutés après coup : optionnels pour qu'un ancien instantané reste lisible.
    let smokedToday: String?; let yesterday: String?
    let limit: String?; let perDay: String?; let cigShort: String?
  }
  let dateKey: String
  let cigarettesToday: Int
  let cigarettesYesterday: Int?
  let objectifJour: Int
  let todayLogged: Bool
  let savedToday: String
  let lifeToday: String
  let savedWeek: String
  let week: [Day]
  let labels: Labels
  let deepLink: String

  static let placeholder = Snapshot(
    dateKey: "", cigarettesToday: 3, cigarettesYesterday: 5, objectifJour: 4, todayLogged: true,
    savedToday: "+7,56 €", lifeToday: "+1 h", savedWeek: "+49,77 €",
    week: [
      Day(label: "J", value: 5, goal: 4), Day(label: "V", value: 4, goal: 4),
      Day(label: "S", value: 2, goal: 4), Day(label: "D", value: 3, goal: 4),
      Day(label: "L", value: 5, goal: 4), Day(label: "M", value: 2, goal: 4),
      Day(label: "Auj.", value: 3, goal: 4),
    ],
    labels: Labels(today: "Aujourd'hui", smoked: "J'ai fumé", cigarettes: "cigarettes",
                   saved: "économisés", life: "de vie", thisWeek: "Cette semaine", goal: "obj. 4",
                   smokedToday: "fumées aujourd'hui", yesterday: "Hier",
                   limit: "Limite", perDay: "/ jour", cigShort: "cig."),
    deepLink: "stopklop://jaifume")

  // Aucun instantané écrit par l'app (compte tout juste créé, ou app jamais
  // ouverte depuis l'installation) : on n'invente rien, tout reste vide.
  static let empty = Snapshot(
    dateKey: "", cigarettesToday: 0, cigarettesYesterday: nil, objectifJour: 0, todayLogged: false,
    savedToday: "—", lifeToday: "—", savedWeek: "—",
    week: (0..<7).map { _ in Day(label: " ", value: nil, goal: 0) },
    labels: Labels(today: "Aujourd'hui", smoked: "J'ai fumé", cigarettes: "cigarettes",
                   saved: "économisés", life: "de vie", thisWeek: "Cette semaine", goal: "",
                   smokedToday: "fumées aujourd'hui", yesterday: "Hier",
                   limit: "Limite", perDay: "/ jour", cigShort: "cig."),
    deepLink: "stopklop://jaifume")

  // Vrai tant que l'app n'a jamais écrit : le widget affiche alors une invite.
  var isEmpty: Bool { dateKey.isEmpty }

  // Passé minuit sans ouverture de l'app, les chiffres « aujourd'hui » sont ceux d'hier.
  var isStale: Bool {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = TimeZone.current
    f.dateFormat = "yyyy-MM-dd"
    return !dateKey.isEmpty && dateKey != f.string(from: Date())
  }
}

func loadSnapshot() -> Snapshot {
  guard
    let raw = UserDefaults(suiteName: appGroup)?.string(forKey: storeKey),
    let data = raw.data(using: .utf8),
    let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data)
  else { return .empty }
  return snapshot
}

// MARK: - Timeline

struct BilanEntry: TimelineEntry {
  let date: Date
  let snapshot: Snapshot
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> BilanEntry {
    BilanEntry(date: Date(), snapshot: .placeholder)
  }
  func getSnapshot(in context: Context, completion: @escaping (BilanEntry) -> Void) {
    completion(BilanEntry(date: Date(), snapshot: context.isPreview ? .placeholder : loadSnapshot()))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<BilanEntry>) -> Void) {
    // Une entrée maintenant, une autre à minuit pour basculer l'affichage « périmé ».
    let now = Date()
    let midnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86_400))
    let snapshot = loadSnapshot()
    let entries = [BilanEntry(date: now, snapshot: snapshot), BilanEntry(date: midnight, snapshot: snapshot)]
    completion(Timeline(entries: entries, policy: .after(midnight.addingTimeInterval(3_600))))
  }
}

// MARK: - Palette de l'app (src/theme.js)

extension Color {
  init(hex: UInt32) {
    self.init(red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255)
  }
  static let skSurface = Color(hex: 0xFFFDF8)
  static let skInk     = Color(hex: 0x173D26)
  static let skMuted   = Color(hex: 0x6F746F)
  static let skGreen   = Color(hex: 0x2F7A44)
  static let skDeep    = Color(hex: 0x1E5530)
  static let skSage    = Color(hex: 0xE8F0E2)
  static let skTrack   = Color(hex: 0xEDE8D8)
  static let skOrange  = Color(hex: 0xF4A000)
  static let skRed     = Color(hex: 0xE5484D)
}

func rounded(_ size: CGFloat, _ weight: Font.Weight = .heavy) -> Font {
  .system(size: size, weight: weight, design: .rounded)
}

// MARK: - Composants

struct DayTile: View {
  let image: String
  let value: String
  let label: String
  var body: some View {
    VStack(spacing: 2) {
      Image(image).resizable().scaledToFit().frame(width: 34, height: 34)
      Text(value).font(rounded(16)).foregroundColor(.skDeep).lineLimit(1).minimumScaleFactor(0.7)
      Text(label).font(rounded(10, .bold)).foregroundColor(.skMuted).lineLimit(1).minimumScaleFactor(0.75)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 8)
    .padding(.horizontal, 4)
    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Color.skSage))
  }
}

// Une jauge par jour : le cadre clair vaut la limite du jour, le vert ce qui a
// été fumé, et le nombre est écrit au-dessus. Une barre de 2 sur 12 restait
// invisible ; ici le remplissage et le chiffre se lisent d'un coup d'œil.
struct WeekGauges: View {
  let week: [Snapshot.Day]

  var body: some View {
    HStack(spacing: 6) {
      ForEach(Array(week.enumerated()), id: \.offset) { index, day in
        let marque = index >= week.count - 2   // hier et aujourd'hui
        VStack(spacing: 4) {
          Text(day.value.map(String.init) ?? "–")
            .font(rounded(12))
            .foregroundColor(day.value == nil ? Color(hex: 0xC4C9C2) : .skDeep)

          ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: 9, style: .continuous)
              .fill(day.value == nil ? Color(hex: 0xF7F5EC) : Color(hex: 0xF1EDE0))
              .frame(width: 28, height: 62)
            if let valeur = day.value {
              // Objectif à 0 (arrêt complet) : la moindre cigarette remplit tout.
              let part = day.goal > 0 ? min(CGFloat(valeur) / CGFloat(day.goal), 1) : (valeur > 0 ? 1 : 0)
              RoundedRectangle(cornerRadius: 9, style: .continuous)
                .fill(valeur > day.goal ? Color.skRed : Color.skGreen)
                .frame(width: 28, height: valeur > 0 ? max(8, 62 * part) : 4)
            }
          }
          .frame(width: 28, height: 62)

          Text(day.label)
            .font(rounded(10.5, marque ? .heavy : .bold))
            .foregroundColor(marque ? .skInk : .skMuted)
            .lineLimit(1).minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
      }
    }
  }
}

// Hier et la limite du jour, ecrits noir sur blanc sous les trois pastilles.
struct PairBox: View {
  let label: String
  let value: String
  let unit: String
  let warm: Bool

  var body: some View {
    HStack(alignment: .firstTextBaseline, spacing: 4) {
      Text(label).font(rounded(11.5, .bold)).foregroundColor(.skMuted).lineLimit(1)
      Spacer(minLength: 2)
      Text(value).font(rounded(19)).foregroundColor(warm ? Color(hex: 0xB07800) : .skDeep)
      Text(unit).font(rounded(10.5, .bold)).foregroundColor(Color(hex: 0x8A938C))
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 8)
    .background(RoundedRectangle(cornerRadius: 14, style: .continuous)
      .fill(warm ? Color(hex: 0xFFF6E3) : Color(hex: 0xF4F2E9)))
  }
}

struct BilanView: View {
  let snapshot: Snapshot

  var body: some View {
    let stale = snapshot.isStale || snapshot.isEmpty
    VStack(alignment: .leading, spacing: 11) {
      HStack {
        Text(snapshot.labels.today).font(rounded(14)).foregroundColor(.skInk)
        Spacer()
        Link(destination: URL(string: snapshot.deepLink) ?? URL(string: "stopklop://")!) {
          HStack(spacing: 5) {
            Image(systemName: "plus").font(.system(size: 11, weight: .heavy))
            Text(snapshot.labels.smoked).font(rounded(13))
          }
          .foregroundColor(.white)
          .padding(.horizontal, 13)
          .padding(.vertical, 7)
          .background(Capsule().fill(Color.skGreen))
        }
      }

      HStack(spacing: 8) {
        DayTile(image: "cible",
                value: stale ? "—" : "\(snapshot.cigarettesToday)/\(snapshot.objectifJour)",
                label: snapshot.labels.smokedToday ?? snapshot.labels.cigarettes)
        DayTile(image: "portefeuille", value: stale ? "—" : snapshot.savedToday, label: snapshot.labels.saved)
        DayTile(image: "sablier", value: stale ? "—" : snapshot.lifeToday, label: snapshot.labels.life)
      }

      if !snapshot.isEmpty {
        HStack(spacing: 8) {
          PairBox(label: snapshot.labels.yesterday ?? "Hier",
                  value: stale ? "—" : (snapshot.cigarettesYesterday.map(String.init) ?? "–"),
                  unit: snapshot.labels.cigShort ?? "",
                  warm: false)
          PairBox(label: snapshot.labels.limit ?? "Limite",
                  value: stale ? "—" : "\(snapshot.objectifJour)",
                  unit: snapshot.labels.perDay ?? "",
                  warm: true)
        }
      }

      HStack(spacing: 8) {
        Image("portefeuille").resizable().scaledToFit().frame(width: 26, height: 26)
        Text(snapshot.labels.thisWeek).font(rounded(14)).foregroundColor(.skInk)
        Spacer()
        Text(snapshot.savedWeek).font(rounded(17, .black)).foregroundColor(.skGreen)
      }

      if snapshot.isEmpty {
        VStack(spacing: 6) {
          Text("Ouvre Stopklop")
            .font(rounded(15)).foregroundColor(.skInk)
          Text("Ton bilan s'affichera ici dès ta première journée enregistrée.")
            .font(rounded(11, .medium)).foregroundColor(.skMuted)
            .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
      } else {
        WeekGauges(week: snapshot.week)
      }
    }
  }
}

struct WidgetBackground: ViewModifier {
  func body(content: Content) -> some View {
    if #available(iOS 17.0, *) {
      content.containerBackground(Color.skSurface, for: .widget)
    } else {
      content.padding(16).background(Color.skSurface)
    }
  }
}

// MARK: - Déclaration

struct StopklopBilanWidget: Widget {
  let kind = "StopklopBilanWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      BilanView(snapshot: entry.snapshot)
        .modifier(WidgetBackground())
        .widgetURL(URL(string: "stopklop://"))
    }
    .configurationDisplayName("Stopklop")
    .description("Ton bilan du jour et tes économies de la semaine.")
    .supportedFamilies([.systemLarge])
  }
}

@main
struct StopklopWidgetBundle: WidgetBundle {
  var body: some Widget {
    StopklopBilanWidget()
  }
}
