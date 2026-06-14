import React, { useEffect, useRef } from 'react';
import { UserProvider } from './src/context/UserContext';
import AppNavigator from './src/navigation/AppNavigator';
import {
  initialiserNotifications,
  nettoyerNotifications,
} from './src/services/notifications';
import { prechargerSons, libererSons } from './src/services/sounds';

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    prechargerSons();
    initialiserNotifications(navigationRef);

    return () => {
      nettoyerNotifications();
      libererSons();
    };
  }, []);

  return (
    <UserProvider>
      <AppNavigator navigationRef={navigationRef} />
    </UserProvider>
  );
}
