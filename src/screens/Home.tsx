import { useEffect, useState } from 'react';
import { CATALOG } from '../data/catalog';
import { HowTo } from './HowTo';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

export function Home({ onCreate, onJoin, onResume }: { onCreate: () => void; onJoin: () => void; onResume?: () => void }) {
  const [help, setHelp] = useState(false);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return (
    <div>
      <div className="hero">
        <div className="vinyl spin" />
        <h1 className="logo">Temazos</h1>
        <p className="muted">Escucha, adivina el año y ordena las canciones en tu línea del tiempo.</p>
      </div>
      <div className="home-actions">
        {onResume && (
          <button className="btn secondary big" onClick={onResume}>
            ▶ Continuar partida
          </button>
        )}
        <button className="btn primary big" onClick={onCreate}>
          Crear partida
        </button>
        <button className="btn big" onClick={onJoin}>
          Unirme con código
        </button>
        <button className="btn ghost" onClick={() => setHelp(true)}>
          Cómo se juega
        </button>
        {installEvt && (
          <button
            className="btn ghost"
            onClick={() => {
              void installEvt.prompt();
              setInstallEvt(null);
            }}
          >
            ⤓ Instalar app
          </button>
        )}
      </div>
      <p className="muted small" style={{ textAlign: 'center' }}>
        {CATALOG.length} canciones de 1954 a hoy · Sin registro · Funciona en móvil y portátil
      </p>
      {help && <HowTo onClose={() => setHelp(false)} />}
    </div>
  );
}
