import React from 'react';
import { FlexWidget, ImageWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import { barTone, isSnapshotStale } from './snapshot';

export const WIDGET_NAME = 'StopklopBilan';

const C = {
  surface: '#FFFDF8',
  ink: '#173D26',
  muted: '#6F746F',
  green: '#2F7A44',
  deep: '#1E5530',
  sage: '#E8F0E2',
  track: '#EDE8D8',
  orange: '#F4A000',
  red: '#E5484D',
};
const TONE = { under: C.green, at: C.orange, over: C.red, empty: C.track };

const IMAGES = {
  cible: require('../../assets/ui-kit/cible_fleche_feuillue_3d.png'),
  portefeuille: require('../../assets/ui-kit/portefeuille_euros_feuilles_3d.png'),
  sablier: require('../../assets/ui-kit/sablier_bois_feuilles_3d.png'),
};

const escapeXml = s => String(s).replace(/[<>&"]/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[ch]));

// Les barres et la ligne d'objectif en pointillés sont dessinées en SVG : les
// primitives de widget Android n'ont ni positionnement absolu ni bordure pointillée.
function weekChartSvg(week, goal, goalLabel, width, height) {
  const labelH = 14;
  const valueH = 13;
  const chartH = Math.max(height - labelH - valueH, 20);
  const top = Math.max(...week.map(d => d.value ?? 0), goal, 1) * 1.15;
  const slot = width / week.length;
  const barW = Math.min(22, slot * 0.62);
  const goalY = valueH + chartH - (chartH * goal) / top;

  const bars = week.map((day, i) => {
    const x = slot * i + (slot - barW) / 2;
    const h = day.value == null ? 3 : Math.max((chartH * day.value) / top, 3);
    const y = valueH + chartH - h;
    const cx = x + barW / 2;
    const isToday = i === week.length - 1;
    const value = day.value == null ? '' :
      `<text x="${cx}" y="${y - 3}" font-size="10" font-weight="800" fill="${C.muted}" text-anchor="middle">${day.value}</text>`;
    return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="5" fill="${TONE[barTone(day.value, day.goal)]}"/>${value}`
      + `<text x="${cx}" y="${height - 2}" font-size="10" font-weight="800" fill="${isToday ? C.ink : C.muted}" text-anchor="middle">${escapeXml(day.label)}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + bars
    + `<line x1="0" y1="${goalY}" x2="${width}" y2="${goalY}" stroke="${C.green}" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="4 3"/>`
    + `<rect x="${width - 46}" y="${Math.max(goalY - 13, 0)}" width="46" height="12" fill="${C.surface}"/>`
    + `<text x="${width - 2}" y="${Math.max(goalY - 4, 9)}" font-size="9" font-weight="800" fill="${C.green}" text-anchor="end">${escapeXml(goalLabel)}</text>`
    + '</svg>';
}

function DayTile({ image, value, label }) {
  return (
    <FlexWidget style={{ flex: 1, backgroundColor: C.sage, borderRadius: 16, paddingVertical: 8, flexDirection: 'column', alignItems: 'center' }}>
      <ImageWidget image={image} imageWidth={34} imageHeight={34} />
      <TextWidget text={value} maxLines={1} style={{ fontSize: 16, fontWeight: '800', color: C.deep }} />
      <TextWidget text={label} maxLines={1} style={{ fontSize: 10, fontWeight: '700', color: C.muted }} />
    </FlexWidget>
  );
}

export function BilanWidget({ snapshot, emptyText, width = 320, height = 330 }) {
  if (!snapshot) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{ height: 'match_parent', width: 'match_parent', backgroundColor: C.surface, borderRadius: 24, padding: 16, justifyContent: 'center', alignItems: 'center' }}
      >
        <ImageWidget image={IMAGES.cible} imageWidth={56} imageHeight={56} />
        <TextWidget text={emptyText} style={{ fontSize: 14, fontWeight: '700', color: C.ink, textAlign: 'center' }} />
      </FlexWidget>
    );
  }

  const stale = isSnapshotStale(snapshot);
  const L = snapshot.labels;
  const padding = 14;
  const chartWidth = Math.max(width - padding * 2, 120);
  const chartHeight = Math.max(height - padding * 2 - 196, 60);

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: C.surface, borderRadius: 24, padding, flexDirection: 'column', flexGap: 10 }}
    >
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget text={L.today} style={{ fontSize: 14, fontWeight: '800', color: C.ink }} />
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: snapshot.deepLink }}
          style={{ backgroundColor: C.green, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 }}
        >
          <TextWidget text={`+ ${L.smoked}`} style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }} />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', flexGap: 8 }}>
        <DayTile image={IMAGES.cible} value={stale ? '—' : `${snapshot.cigarettesToday}/${snapshot.objectifJour}`} label={L.cigarettes} />
        <DayTile image={IMAGES.portefeuille} value={stale ? '—' : snapshot.savedToday} label={L.saved} />
        <DayTile image={IMAGES.sablier} value={stale ? '—' : snapshot.lifeToday} label={L.life} />
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', flexGap: 8 }}>
        <ImageWidget image={IMAGES.portefeuille} imageWidth={26} imageHeight={26} />
        <TextWidget text={L.thisWeek} style={{ fontSize: 14, fontWeight: '800', color: C.ink }} />
        <FlexWidget style={{ flex: 1 }} />
        <TextWidget text={snapshot.savedWeek} style={{ fontSize: 17, fontWeight: '900', color: C.green }} />
      </FlexWidget>

      <SvgWidget
        svg={weekChartSvg(snapshot.week, snapshot.objectifJour, L.goal, chartWidth, chartHeight)}
        style={{ width: chartWidth, height: chartHeight }}
      />
    </FlexWidget>
  );
}
