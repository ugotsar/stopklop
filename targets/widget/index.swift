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
  }
  let dateKey: String
  let cigarettesToday: Int
  let objectifJour: Int
  let todayLogged: Bool
  let savedToday: String
  let lifeToday: String
  let savedWeek: String
  let week: [Day]
  let labels: Labels
  let deepLink: String

  static let placeholder = Snapshot(
    dateKey: "", cigarettesToday: 3, objectifJour: 4, todayLogged: true,
    savedToday: "+7,56 €", lifeToday: "+1 h", savedWeek: "+49,77 €",
    week: [
      Day(label: "J", value: 5, goal: 4), Day(label: "V", value: 4, goal: 4),
      Day(label: "S", value: 2, goal: 4), Day(label: "D", value: 3, goal: 4),
      Day(label: "L", value: 5, goal: 4), Day(label: "M", value: 2, goal: 4),
      Day(label: "Auj.", value: 3, goal: 4),
    ],
    labels: Labels(today: "Aujourd'hui", smoked: "J'ai fumé", cigarettes: "cigarettes",
                   saved: "économisés", life: "de vie", thisWeek: "Cette semaine", goal: "obj. 4"),
    deepLink: "stopklop://jaifume")

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
  else { return .placeholder }
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

func barColor(_ day: Snapshot.Day) -> Color {
  guard let value = day.value else { return .skTrack }
  if value > day.goal { return .skRed }
  if value == day.goal && value > 0 { return .skOrange }
  return .skGreen
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
      Text(label).font(rounded(10, .bold)).foregroundColor(.skMuted).lineLimit(1)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 8)
    .padding(.horizontal, 4)
    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Color.skSage))
  }
}

struct WeekChart: View {
  let week: [Snapshot.Day]
  let goal: Int
  let goalLabel: String

  var body: some View {
    GeometryReader { geo in
      let labelH: CGFloat = 14
      let valueH: CGFloat = 13
      let chartH = max(geo.size.height - labelH - valueH, 20)
      let top = CGFloat(max(week.compactMap { $0.value }.max() ?? 0, goal, 1)) * 1.15
      let goalY = valueH + chartH - chartH * CGFloat(goal) / top

      ZStack(alignment: .topLeading) {
        HStack(alignment: .bottom, spacing: 6) {
          ForEach(Array(week.enumerated()), id: \.offset) { index, day in
            let isToday = index == week.count - 1
            VStack(spacing: 2) {
              Text(day.value.map(String.init) ?? " ")
                .font(rounded(10)).foregroundColor(.skMuted).frame(height: valueH)
              Spacer(minLength: 0)
              RoundedRectangle(cornerRadius: 5, style: .continuous)
                .fill(barColor(day))
                .frame(maxWidth: 22)
                .frame(height: day.value.map { max(chartH * CGFloat($0) / top, 3) } ?? 3)
              Text(day.label)
                .font(rounded(10)).foregroundColor(isToday ? .skInk : .skMuted)
                .frame(height: labelH)
            }
            .frame(maxWidth: .infinity)
          }
        }

        Path { p in
          p.move(to: CGPoint(x: 0, y: goalY))
          p.addLine(to: CGPoint(x: geo.size.width, y: goalY))
        }
        .stroke(Color.skGreen.opacity(0.5), style: StrokeStyle(lineWidth: 1.5, dash: [4, 3]))

        Text(goalLabel)
          .font(rounded(9)).foregroundColor(.skGreen)
          .padding(.horizontal, 4)
          .background(Color.skSurface)
          .position(x: geo.size.width - 22, y: max(goalY - 7, 6))
      }
    }
  }
}

struct BilanView: View {
  let snapshot: Snapshot

  var body: some View {
    let stale = snapshot.isStale
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
                label: snapshot.labels.cigarettes)
        DayTile(image: "portefeuille", value: stale ? "—" : snapshot.savedToday, label: snapshot.labels.saved)
        DayTile(image: "sablier", value: stale ? "—" : snapshot.lifeToday, label: snapshot.labels.life)
      }

      HStack(spacing: 8) {
        Image("portefeuille").resizable().scaledToFit().frame(width: 26, height: 26)
        Text(snapshot.labels.thisWeek).font(rounded(14)).foregroundColor(.skInk)
        Spacer()
        Text(snapshot.savedWeek).font(rounded(17, .black)).foregroundColor(.skGreen)
      }

      WeekChart(week: snapshot.week, goal: snapshot.objectifJour, goalLabel: snapshot.labels.goal)
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
