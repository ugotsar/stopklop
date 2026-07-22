// Mock web pour expo-notifications — toutes les fonctions sont des no-ops sur web
export const setNotificationHandler = () => {};
export const getPermissionsAsync = async () => ({ status: 'denied' });
export const requestPermissionsAsync = async () => ({ status: 'denied' });
export const scheduleNotificationAsync = async () => {};
export const cancelScheduledNotificationAsync = async () => {};
export const getAllScheduledNotificationsAsync = async () => [];
export const addNotificationResponseReceivedListener = () => ({ remove: () => {} });
export const addNotificationReceivedListener = () => ({ remove: () => {} });
export const removeNotificationSubscription = () => {};
export const SchedulableTriggerInputTypes = { DAILY: 'daily', CALENDAR: 'calendar', TIME_INTERVAL: 'timeInterval' };
export const AndroidImportance = { DEFAULT: 3, HIGH: 4, MAX: 5 };
export default {
  setNotificationHandler,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  addNotificationResponseReceivedListener,
  addNotificationReceivedListener,
  removeNotificationSubscription,
  SchedulableTriggerInputTypes,
  AndroidImportance,
};
