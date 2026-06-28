import * as Notifications from 'expo-notifications';

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
      title: '☀️ Nouvelle journée, nouveau départ',
      body: "Aujourd'hui, tu peux faire mieux qu'hier. Note tes cigarettes ce soir.",
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
      title: '🚬 Comment ça se passe aujourd\'hui ?',
      body: "Pense à noter tes cigarettes. Chaque chiffre compte.",
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
      title: '📊 Bilan de ta journée',
      body: "Tu as fumé combien aujourd'hui ? Note-le avant de dormir.",
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
