import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { BilanWidget, WIDGET_NAME } from './BilanWidget';
import { WIDGET_STORAGE_KEY } from './snapshot';

export async function syncWidget(snapshot) {
  try {
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(snapshot));
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: info => <BilanWidget snapshot={snapshot} width={info.width} height={info.height} />,
    });
  } catch (_) {
    // Expo Go n'a pas le module natif ; le widget ne doit jamais faire planter l'app.
  }
}
