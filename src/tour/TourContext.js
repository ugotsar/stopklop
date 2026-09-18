import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useUser } from '../context/UserContext';
import { TOUR_STEPS } from './tourSteps';
import TourOverlay from './TourOverlay';

const RegistryContext = createContext(null);

export function TourProvider({ navigationRef, children }) {
  const { profile, updateProfile } = useUser();
  const targets = useRef(new Map());
  const scrolls = useRef(new Map());
  const started = useRef(false);
  const [step, setStep] = useState(null);

  const visite = profile?.visiteGuidee;

  // Une seule visite par compte : tant qu'aucun statut n'est enregistré, on
  // l'affiche (bienvenue, ou reprise à l'étape où elle a été interrompue).
  useEffect(() => {
    if (started.current || !profile || visite?.statut) return;
    started.current = true;
    setStep(Math.min(visite?.etape ?? 0, TOUR_STEPS.length - 1));
  }, [profile, visite?.statut, visite?.etape]);

  const navigate = useCallback((route) => {
    const go = (tries) => {
      const nav = navigationRef.current;
      if (nav?.isReady()) nav.navigate(...route);
      else if (tries < 50) setTimeout(() => go(tries + 1), 100);
    };
    go(0);
  }, [navigationRef]);

  useEffect(() => {
    const route = step != null && TOUR_STEPS[step].route;
    if (route) navigate(route);
  }, [step, navigate]);

  // Le retour Android quitterait l'écran que la bulle est en train de décrire.
  useEffect(() => {
    if (step == null) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [step]);

  const end = useCallback((statut) => {
    const etape = step ?? 0;
    setStep(null);
    updateProfile({ visiteGuidee: { statut, etape } });
    if (etape > 0) navigate(['MainTabs', { screen: 'Accueil' }]);
  }, [step, updateProfile, navigate]);

  const lastAdvance = useRef(0);
  const next = useCallback(() => {
    if (step == null) return;
    // Un double tap ou un clic répété ne doit jamais sauter d'étape.
    const now = Date.now();
    if (now - lastAdvance.current < 700) return;
    lastAdvance.current = now;
    if (step >= TOUR_STEPS.length - 1) {
      end('terminee');
      return;
    }
    const etape = step + 1;
    setStep(etape);
    updateProfile({ visiteGuidee: { etape } });
  }, [step, end, updateProfile]);

  const registry = useMemo(() => ({
    registerTarget: (id, ref) => targets.current.set(id, ref),
    unregisterTarget: (id, ref) => {
      if (targets.current.get(id) === ref) targets.current.delete(id);
    },
    registerScroll: (name, ref) => scrolls.current.set(name, { ref, offset: 0 }),
    unregisterScroll: (name, ref) => {
      if (scrolls.current.get(name)?.ref === ref) scrolls.current.delete(name);
    },
    setScrollOffset: (name, y) => {
      const entry = scrolls.current.get(name);
      if (entry) entry.offset = y;
    },
  }), []);

  return (
    <RegistryContext.Provider value={registry}>
      <View style={{ flex: 1 }}>
        {children}
        {step != null && (
          <TourOverlay
            step={step}
            targets={targets}
            scrolls={scrolls}
            onNext={next}
            onLater={() => end('plus_tard')}
            onSkip={() => end('passee')}
          />
        )}
      </View>
    </RegistryContext.Provider>
  );
}

// Hors TourProvider (écrans d'onboarding, paywall), ces hooks ne font rien.
export function useTourTarget(id) {
  const registry = useContext(RegistryContext);
  const ref = useRef(null);
  useEffect(() => {
    if (!registry) return undefined;
    registry.registerTarget(id, ref);
    return () => registry.unregisterTarget(id, ref);
  }, [registry, id]);
  return ref;
}

export function useTourScroll(name) {
  const registry = useContext(RegistryContext);
  const ref = useRef(null);
  useEffect(() => {
    if (!registry) return undefined;
    registry.registerScroll(name, ref);
    return () => registry.unregisterScroll(name, ref);
  }, [registry, name]);
  const onScroll = useCallback(
    e => registry?.setScrollOffset(name, e.nativeEvent.contentOffset.y),
    [registry, name],
  );
  return { ref, onScroll, scrollEventThrottle: 32 };
}
