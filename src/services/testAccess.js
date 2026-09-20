import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ TEMPORAIRE — à retirer avant la mise en vente.
// Tant que les abonnements ne sont pas disponibles sur les stores (contrat
// Apple non signé, produits en « métadonnées manquantes »), personne ne peut
// acheter, donc personne ne peut entrer dans l'app. Ce drapeau local permet
// d'ouvrir l'app pour la tester en conditions réelles. Le bouton qui l'active
// n'apparaît QUE lorsque aucun abonnement n'est proposé par le store : dès que
// les abonnements fonctionneront, il disparaîtra de lui-même.
const KEY = '@stopklop_test_access';

export async function loadTestAccess() {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'true';
  } catch (_) {
    return false;
  }
}

export async function grantTestAccess() {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch (_) {}
}

export async function clearTestAccess() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (_) {}
}
