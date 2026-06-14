import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIF_ID_MIDI = 'stopklop-midi';
const NOTIF_ID_SOIR = 'stopklop-soir';

let _responseListener = null;

export async function demanderPermissionNotifications() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function programmerNotificationsQuotidiennes() {
  await annulerToutesNotifications();

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_ID_MIDI,
    content: {
      title: 'Un clic. Une réponse.',
      body: "Tu as fumé aujourd'hui ?",
      data: { screen: 'JaiFume' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 13,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_ID_SOIR,
    content: {
      title: 'Un clic. Une réponse.',
      body: "Tu as fumé aujourd'hui ?",
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
  await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_SOIR);
}

export async function annulerToutesNotifications() {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_MIDI);
  await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_SOIR);
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
