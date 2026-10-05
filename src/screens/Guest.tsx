import { useEffect, useRef, useState } from 'react';
import { GameView } from '../components/GameView';
import type { GameAction } from '../game/types';
import { getClientId, GuestSession, normalizeCode, type GuestStatus, type SyncPayload } from '../net/session';
import { load, save } from '../storage';

const NAME_KEY = 'temazos.playerName';

export function JoinForm({ initialCode, onJoin, onBack }: { initialCode?: string; onJoin: (code: string, name: string) => void; onBack: () => void }) {
  const [code, setCode] = useState(initialCode ?? '');
  const [name, setName] = useState(() => load(NAME_KEY, ''));
  const valid = normalizeCode(code).length === 4 && name.trim().length > 0;
  return (
    <div className="stack" style={{ maxWidth: 420, margin: '0 auto' }}>
      <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        ← Volver
      </button>
      <h1>Unirme a una partida</h1>
      <form
        className="panel stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          save(NAME_KEY, name.trim());
          onJoin(normalizeCode(code), name.trim());
        }}
      >
        <label className="field">
          <span>Código de sala</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(normalizeCode(e.target.value).slice(0, 4))}
            placeholder="ABCD"
            autoCapitalize="characters"
            autoComplete="off"
            style={{ fontSize: '1.6rem', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 800 }}
          />
        </label>
        <label className="field">
          <span>Tu nombre</span>
          <input type="text" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="Ej. Lucía" autoFocus={!!initialCode} />
        </label>
        <button className="btn primary big" type="submit" disabled={!valid}>
          Entrar
        </button>
      </form>
    </div>
  );
}

const STATUS_TEXT: Record<GuestStatus, string> = {
  connecting: 'Conectando con la sala…',
  connected: 'Conectado',
  reconnecting: 'Conexión perdida, reintentando…',
  'not-found': 'No existe ninguna sala abierta con ese código.',
  error: 'Error de conexión.',
};

export function GuestRoom({ code, name, onLeave }: { code: string; name: string; onLeave: () => void }) {
  const [status, setStatus] = useState<GuestStatus>('connecting');
  const [sync, setSync] = useState<SyncPayload | null>(null);
  const session = useRef<GuestSession | null>(null);
  const clientId = getClientId();

  useEffect(() => {
    const s = new GuestSession(code, name, { onSync: setSync, onStatus: setStatus });
    session.current = s;
    return () => s.destroy();
  }, [code, name]);

  const me = sync?.players.find((p) => p.clientId === clientId);
  const myTeam = sync?.teams.find((t) => t.id === me?.teamId);
  const dispatch = (action: GameAction) => session.current?.send({ t: 'action', action });

  if (status === 'not-found' || status === 'error') {
    return (
      <div className="stack" style={{ maxWidth: 420, margin: '40px auto', textAlign: 'center' }}>
        <div className="notice error">{STATUS_TEXT[status]}</div>
        <p className="muted small">Comprueba el código con el anfitrión y que ambos tengáis internet.</p>
        <button className="btn" onClick={onLeave}>
          Volver
        </button>
      </div>
    );
  }

  if (!sync) {
    return (
      <div className="hero">
        <div className="vinyl spin" />
        <p>{STATUS_TEXT[status]}</p>
        <button className="btn ghost" onClick={onLeave}>
          Cancelar
        </button>
      </div>
    );
  }

  const banner = status !== 'connected' && <div className="toast">{STATUS_TEXT[status]}</div>;

  if (!myTeam) {
    return (
      <div className="stack" style={{ maxWidth: 480, margin: '0 auto' }}>
        {banner}
        <h1>¡Hola, {name}!</h1>
        <p className="muted">Sala {code}. Elige tu equipo:</p>
        {sync.teams.map((t) => (
          <button key={t.id} className="btn big block" style={{ borderColor: t.color }} onClick={() => session.current?.send({ t: 'pickTeam', teamId: t.id })}>
            <span className="color-dot" style={{ background: t.color }} /> {t.name}
          </button>
        ))}
        <button className="btn ghost" onClick={onLeave}>
          Salir
        </button>
      </div>
    );
  }

  if (!sync.game) {
    const mates = sync.players.filter((p) => p.teamId === myTeam.id).map((p) => p.name);
    return (
      <div className="hero">
        {banner}
        <div className="vinyl spin" />
        <h2>
          Estás en <span style={{ color: myTeam.color }}>{myTeam.name}</span>
        </h2>
        <p className="muted">{mates.join(' · ')}</p>
        <p>Esperando a que el anfitrión empiece la partida…</p>
        <div className="actions">
          <button className="btn sm" onClick={() => session.current?.send({ t: 'pickTeam', teamId: '' })}>
            Cambiar de equipo
          </button>
          <button className="btn sm ghost" onClick={onLeave}>
            Salir
          </button>
        </div>
      </div>
    );
  }

  const extraMembers: Record<string, string[]> = {};
  for (const p of sync.players) if (p.teamId) (extraMembers[p.teamId] ??= []).push(p.name);

  return (
    <>
      {banner}
      <div className="row small muted" style={{ justifyContent: 'center', marginBottom: 8 }}>
        <span className="color-dot" style={{ background: myTeam.color }} /> Juegas en {myTeam.name} · Sala {code}
      </div>
      <GameView game={sync.game} myTeamId={myTeam.id} isHost={false} dispatch={dispatch} onExit={onLeave} extraMembers={extraMembers} />
    </>
  );
}
