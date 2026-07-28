import * as Notifications from 'expo-notifications';
import i18n from '../i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIF_MATIN = 'stopklop-matin';
const NOTIF_MIDI  = 'stopklop-midi';
const NOTIF_SOIR  = 'stopklop-soir';

let _responseListener = null;

export async function demanderPermissionNotifications() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function programmerNotificationsQuotidiennes() {
  await annulerToutesNotifications();

  // ── Matin : motivation pour bien démarrer ──
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_MATIN,
    content: {
      title: i18n.t('notifications:scheduled.morning.title'),
      body: i18n.t('notifications:scheduled.morning.body'),
      data: { screen: 'JaiFume' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });

  // ── Midi : rappel discret ──
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_MIDI,
    content: {
      title: i18n.t('notifications:scheduled.noon.title'),
      body: i18n.t('notifications:scheduled.noon.body'),
      data: { screen: 'JaiFume' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 13,
      minute: 0,
    },
  });

  // ── Soir : bilan de la journée ──
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_SOIR,
    content: {
      title: i18n.t('notifications:scheduled.evening.title'),
      body: i18n.t('notifications:scheduled.evening.body'),
      data: { screen: 'JaiFume' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });
}

export async function annulerNotificationSoir() {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_SOIR);
}

export async function annulerToutesNotifications() {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_MATIN);
  await Notifications.cancelScheduledNotificationAsync(NOTIF_MIDI);
  await Notifications.cancelScheduledNotificationAsync(NOTIF_SOIR);
}

export async function initialiserNotifications(navigationRef) {
  const accordee = await demanderPermissionNotifications();
  if (accordee) await programmerNotificationsQuotidiennes();

  _responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen;
    if (screen === 'JaiFume' && navigationRef?.current) {
      navigationRef.current.navigate('JaiFume');
    }
  });
}

export function nettoyerNotifications() {
  if (_responseListener) {
    Notifications.removeNotificationSubscription(_responseListener);
    _responseListener = null;
  }
}
