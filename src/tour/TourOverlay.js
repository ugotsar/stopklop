import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadow } from '../theme';
import { UI } from '../assets/uiKit';
import { TOUR_STEPS } from './tourSteps';

const WIDGET_PREVIEW = require('../../assets/ui-kit/widget-preview.png');

const HOLE_PAD = 6;
const BUBBLE_ROOM = 250;
const MASK = 'rgba(12, 38, 26, 0.55)';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const measure = node => new Promise(resolve => {
  if (!node?.measureInWindow) { resolve(null); return; }
  node.measureInWindow((x, y, width, height) => resolve(width > 0 && height > 0 ? { x, y, width, height } : null));
});

export default function TourOverlay({ step, targets, scrolls, onNext, onLater, onSkip }) {
  const { t } = useTranslation('tour');
  const rootRef = useRef(null);
  // Position calculée pour une étape donnée : tant qu'elle ne correspond pas à
  // l'étape affichée, la bulle reste cachée (et donc non cliquable).
  const [placed, setPlaced] = useState(null);
  const config = TOUR_STEPS[step];

  // Attend que l'écran cible soit monté, fait défiler l'élément sous les en-têtes
  // fixes s'il est hors de la zone visible, puis le mesure dans le repère du calque.
  const locate = useCallback(async (isCancelled) => {
    const done = (hole, root) => {
      if (!isCancelled()) setPlaced({ step, hole, width: root?.width ?? 0, height: root?.height ?? 0 });
    };
    if (!config.target) { done(null, await measure(rootRef.current)); return; }

    let scrolled = false;
    for (let i = 0; i < 40 && !isCancelled(); i++) {
      await sleep(i === 0 ? 450 : 120);
      const root = await measure(rootRef.current);
      const rect = await measure(targets.current.get(config.target)?.current);
      if (!root || !rect) continue;
      const local = { x: rect.x - root.x, y: rect.y - root.y, width: rect.width, height: rect.height };

      const scroll = config.scroll && scrolls.current.get(config.scroll);
      const scrollView = scroll?.ref.current;
      const area = scrollView ? await measure(scrollView.getNativeScrollRef?.() ?? scrollView) : null;
      const areaTop = area ? area.y - root.y : 0;
      const areaBottom = area ? areaTop + area.height : root.height;
      const visible = local.y >= areaTop + 8 && local.y + local.height <= areaBottom - 8;
      if (!visible && !scrolled && scrollView) {
        scrolled = true;
        scrollView.scrollTo({ y: Math.max(0, scroll.offset + local.y - areaTop - 12), animated: false });
        continue;
      }
      done(local, root);
      return;
    }
    done(null, await measure(rootRef.current));
  }, [config, step, targets, scrolls]);

  useEffect(() => {
    let cancelled = false;
    locate(() => cancelled);
    return () => { cancelled = true; };
  }, [locate]);

  const block = { onStartShouldSetResponder: () => true };

  if (config.key === 'welcome') {
    return (
      <View style={[StyleSheet.absoluteFill, s.welcome]} {...block}>
        <Text style={s.brand}>stopklop</Text>
        <Image source={UI.mascotte_entete} style={s.welcomeMascot} resizeMode="contain" />
        <Text style={s.welcomeTitle}>{t('welcome.title')}</Text>
        <Text style={s.welcomeText}>{t('welcome.text')}</Text>
        <TouchableOpacity style={s.welcomeCta} onPress={onNext} accessibilityRole="button">
          <Text style={s.ctaText}>{t('welcome.start')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onLater} hitSlop={12} accessibilityRole="button">
          <Text style={s.later}>{t('welcome.later')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Dernière étape : le widget d'écran d'accueil, en plein écran comme l'accueil
  // de la visite. Aucune cible à pointer, c'est une présentation.
  if (config.key === 'widget') {
    return (
      <ScrollView
        style={[StyleSheet.absoluteFill, s.widgetScreen]}
        contentContainerStyle={s.widgetContent}
        showsVerticalScrollIndicator={false}
        {...block}
      >
        <Text style={s.brand}>stopklop</Text>
        <Image source={WIDGET_PREVIEW} style={s.widgetPreview} resizeMode="contain" />
        <Text style={s.widgetTitle}>{t('widget.title')}</Text>
        <Text style={s.widgetText}>{t('widget.text')}</Text>
        <View style={s.widgetSteps}>
          {['step1', 'step2', 'step3'].map((cle, i) => (
            <View key={cle} style={s.widgetStep}>
              <View style={s.widgetNum}><Text style={s.widgetNumText}>{i + 1}</Text></View>
              <Text style={s.widgetStepText}>{t(`widget.${cle}`)}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={s.welcomeCta} onPress={onNext} accessibilityRole="button">
          <Text style={s.ctaText}>{t('widget.cta')}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const ready = placed?.step === step;
  const hole = ready ? placed.hole : null;
  const W = ready ? placed.width : 0;
  const H = ready ? placed.height : 0;

  let box = null;
  if (hole && H > 0) {
    const left = Math.max(0, hole.x - HOLE_PAD);
    const top = Math.max(0, hole.y - HOLE_PAD);
    const right = Math.min(W, hole.x + hole.width + HOLE_PAD);
    const bottom = Math.min(H, hole.y + hole.height + HOLE_PAD);
    box = { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
  }

  let bubblePos = { bottom: 24 };
  if (box) {
    const below = H - (box.top + box.height);
    const above = box.top;
    if (below >= BUBBLE_ROOM && below >= above) bubblePos = { top: box.top + box.height + 14 };
    else if (above >= BUBBLE_ROOM) bubblePos = { bottom: H - box.top + 14 };
  }

  const labels = {
    smokedLink: t('dashboard:today.smokedLink').replace(/[\s›]+$/, ''),
    validate: t('dashboard:today.validateButton'),
    save: t('common:save'),
    period: t('statistiques:tabs.period'),
    modifyPlan: t('plan:recommendedPlan.modifyButton'),
  };
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <View ref={rootRef} collapsable={false} style={StyleSheet.absoluteFill} {...block}>
      {box ? (
        <>
          <View style={[s.mask, { top: 0, left: 0, right: 0, height: box.top }]} />
          <View style={[s.mask, { top: box.top + box.height, left: 0, right: 0, bottom: 0 }]} />
          <View style={[s.mask, { top: box.top, height: box.height, left: 0, width: box.left }]} />
          <View style={[s.mask, { top: box.top, height: box.height, left: box.left + box.width, right: 0 }]} />
          <View pointerEvents="none" style={[s.ring, box]} />
        </>
      ) : (
        <View style={[s.mask, StyleSheet.absoluteFill]} />
      )}

      {ready && (
        <View style={[s.bubble, bubblePos]}>
          <View style={s.bubbleHead}>
            <Image source={UI.mascotte_entete} style={s.bubbleMascot} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={s.guide}>{t('guideLabel', { current: step + 1, total: TOUR_STEPS.length })}</Text>
              <Text style={s.title}>{t(`steps.${config.key}.title`)}</Text>
            </View>
          </View>
          <Text style={s.text}>{t(`steps.${config.key}.text`, labels)}</Text>
          <View style={s.actions}>
            <TouchableOpacity onPress={onSkip} hitSlop={12} accessibilityRole="button">
              <Text style={s.skip}>{t('skip')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cta} onPress={onNext} accessibilityRole="button">
              <Text style={s.ctaText}>{isLast ? t('steps.finish.cta') : t('next')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  mask: { position: 'absolute', backgroundColor: MASK },
  // Rayon faible : la découpe du masque est rectangulaire, un grand arrondi
  // laisserait dépasser ses coins clairs.
  ring: { position: 'absolute', borderRadius: 4, borderWidth: 3, borderColor: colors.primary },

  bubble: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: '#FFFDF7', borderRadius: 24, padding: 18,
    ...shadow.card,
  },
  bubbleHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  bubbleMascot: { width: 52, height: 52 },
  guide: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.gray, marginBottom: 2 },
  title: { fontSize: 19, fontWeight: '800', color: colors.primaryDeep },
  text: { fontSize: 15, lineHeight: 22, color: '#2F4A3D' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  skip: { fontSize: 13, color: colors.gray },
  cta: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: 20 },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', textAlign: 'center' },

  welcome: {
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, paddingVertical: 40,
  },
  brand: { fontSize: 30, fontWeight: '900', color: colors.primary, marginBottom: 24 },
  welcomeMascot: { width: 190, height: 190, marginBottom: 28 },
  welcomeTitle: { fontSize: 28, fontWeight: '900', color: colors.primaryDeep, textAlign: 'center', marginBottom: 14 },
  welcomeText: { fontSize: 16, lineHeight: 24, color: '#2F4A3D', textAlign: 'center', marginBottom: 32 },
  welcomeCta: {
    alignSelf: 'stretch', backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: 16, marginBottom: 18,
  },
  later: { fontSize: 15, fontWeight: '600', color: colors.primary },

  widgetScreen: { backgroundColor: colors.cream },
  widgetContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  widgetPreview: { width: 250, height: 236, marginBottom: 20 },
  widgetTitle: { fontSize: 23, fontWeight: '900', color: colors.primaryDeep, textAlign: 'center', marginBottom: 10 },
  widgetText: { fontSize: 15, lineHeight: 21, color: '#2F4A3D', textAlign: 'center', marginBottom: 20, maxWidth: 320 },
  widgetSteps: { alignSelf: 'stretch', gap: 10, marginBottom: 26, paddingHorizontal: 10 },
  widgetStep: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  widgetNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  widgetNumText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  widgetStepText: { flex: 1, fontSize: 14, lineHeight: 19, color: '#2F4A3D', fontWeight: '600' },
});
