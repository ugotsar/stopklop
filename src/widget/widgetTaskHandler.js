import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { initI18n } from '../i18n';
import { BilanWidget } from './BilanWidget';
import { WIDGET_STORAGE_KEY } from './snapshot';

// Exécuté par Android hors de l'app (tâche headless) : on relit le dernier
// instantané écrit par syncWidget.android.js.
export async function widgetTaskHandler({ widgetAction, widgetInfo, renderWidget }) {
  if (!['WIDGET_ADDED', 'WIDGET_UPDATE', 'WIDGET_RESIZED'].includes(widgetAction)) return;

  await initI18n();
  let snapshot = null;
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    snapshot = raw ? JSON.parse(raw) : null;
  } catch (_) {
    snapshot = null;
  }

  renderWidget(
    <BilanWidget
      snapshot={snapshot}
      emptyText={i18n.t('widget:openApp')}
      width={widgetInfo.width}
      height={widgetInfo.height}
    />,
  );
}
