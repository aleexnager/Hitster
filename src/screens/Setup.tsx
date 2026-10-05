import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import QRCode from 'qrcode';
import { parseSongLines } from '../data/catalog';
import { COUNTRIES, COUNTRY_PRESETS, DECADES, GENRES, TEAM_COLORS } from '../data/taxonomy';
import { minDeckSize } from '../game/engine';
import type { GameConfig, SongSource } from '../game/types';
import { Modal } from '../components/Modal';
import { Stepper } from '../components/Stepper';
import { newTeam, type HostGame, type TeamDraft } from '../host/useHostGame';

const THIS_YEAR = new Date().getFullYear();

export function joinUrl(code: string): string {
  return `${new URL(import.meta.env.BASE_URL, location.origin).href}?join=${code}`;
}

function toggle(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function TeamEditor({ team, onChange, onRemove, canRemove, onlinePlayers }: {
  team: TeamDraft;
  onChange: (t: TeamDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
  onlinePlayers: string[];
}) {
  const [member, setMember] = useState('');
  const addMember = () => {
    const name = member.trim();
    if (!name) return;
    onChange({ ...team, members: [...team.members, name] });
    setMember('');
  };
  return (
    <div className="team-edit" style={{ '--team': team.color } as CSSProperties}>
      <div className="row">
        <input
          type="text"
          value={team.name}
          maxLength={24}
          onChange={(e) => onChange({ ...team, name: e.target.value })}
          aria-label="Nombre del equipo"
          style={{ flex: 1, minWidth: 140 }}
        />
        {canRemove && (
          <button className="icon-btn" onClick={onRemove} aria-label="Eliminar equipo">
            🗑
          </button>
        )}
      </div>
      <div className="row" style={{ gap: 6 }}>
        {TEAM_COLORS.map((c) => (
          <button
            key={c}
            className={`color-pick${team.color === c ? ' on' : ''}`}
            style={{ background: c }}
            onClick={() => onChange({ ...team, color: c })}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
      <div className="chips">
        {team.members.map((m, i) => (
          <span key={`${m}-${i}`} className="member">
            {m}
            <button onClick={() => onChange({ ...team, members: team.members.filter((_, j) => j !== i) })} aria-label={`Quitar a ${m}`}>
              ✕
            </button>
          </span>
        ))}
        {onlinePlayers.map((m) => (
          <span key={`online-${m}`} className="member" title="Conectado desde su móvil">
            📱 {m}
          </span>
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          addMember();
        }}
      >
        <input type="text" placeholder="Añadir jugador (opcional)" value={member} maxLength={24} onChange={(e) => setMember(e.target.value)} style={{ flex: 1 }} />
        <button className="btn sm" type="submit" disabled={!member.trim()}>
          Añadir
        </button>
      </form>
    </div>
  );
}

function RoomPanel({ host }: { host: HostGame }) {
  const { room, teams } = host;
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    if (!room.code) return setQr(null);
    QRCode.toDataURL(joinUrl(room.code), { margin: 1, width: 300 }).then(setQr, () => setQr(null));
  }, [room.code]);

  if (!room.code) {
    return (
      <section className="panel stack">
        <h2>📱 Jugar con móviles</h2>
        <p className="muted small" style={{ margin: 0 }}>
          Opcional. Cada equipo puede colocar sus cartas y desafiar desde su propio móvil. La música sigue sonando en este dispositivo.
        </p>
        <button className="btn secondary" onClick={() => room.open()}>
          Abrir sala online
        </button>
      </section>
    );
  }

  return (
    <section className="panel stack">
      <div className="row spread">
        <h2 style={{ margin: 0 }}>📱 Sala online</h2>
        <button className="btn sm ghost" onClick={room.close}>
          Cerrar sala
        </button>
      </div>
      <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
        {qr && <img className="qr" src={qr} alt={`QR para unirse a la sala ${room.code}`} />}
        <div className="stack" style={{ gap: 4 }}>
          <span className="muted small">Código de sala</span>
          <span className="room-code">{room.code}</span>
          <span className="muted small">Escanea el QR o entra en esta web y pulsa «Unirme».</span>
          <span className="small">
            {room.status === 'open' ? '🟢 Sala abierta' : room.status === 'opening' ? '🟡 Conectando…' : '🔴 Error de conexión'}
          </span>
        </div>
      </div>
      {room.status === 'error' && (
        <div className="notice error">
          No se pudo abrir la sala ({room.error}). Comprueba la conexión a internet. Podéis jugar igualmente en este dispositivo.
        </div>
      )}
      <div className="stack" style={{ gap: 8 }}>
        <strong className="small">Jugadores conectados ({room.players.length})</strong>
        {room.players.length === 0 && <span className="muted small">Todavía nadie…</span>}
        {room.players.map((p) => (
          <div key={p.clientId} className="row">
            <span>{p.connected ? '🟢' : '⚪'}</span>
            <span style={{ flex: 1 }}>{p.name}</span>
            <select
              value={p.teamId ?? ''}
              onChange={(e) => room.assignPlayer(p.clientId, e.target.value || null)}
              style={{ width: 'auto' }}
              aria-label={`Equipo de ${p.name}`}
            >
              <option value="">Sin equipo</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button className="icon-btn" onClick={() => room.removePlayer(p.clientId)} aria-label={`Expulsar a ${p.name}`}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomSongsModal({ value, onSave, onClose }: { value: string; onSave: (v: string) => void; onClose: () => void }) {
  const [text, setText] = useState(value);
  const parsed = useMemo(() => parseSongLines(text, true), [text]);
  return (
    <Modal title="Mis canciones" onClose={onClose}>
      <p className="muted small">
        Una canción por línea: <code>Título;Artista;Año;géneros;países</code>. Géneros y países son opcionales. Ejemplo:
        <br />
        <code>Mi canción favorita;Mi grupo;2004;pop,rock;ES</code>
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Título;Artista;Año" />
      <p className="small">
        ✔ {parsed.songs.length} canciones válidas
        {parsed.errors.length > 0 && <span style={{ color: 'var(--bad)' }}> · ✘ {parsed.errors.length} líneas con errores</span>}
      </p>
      {parsed.errors.length > 0 && <pre className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{parsed.errors.slice(0, 5).join('\n')}</pre>}
      <div className="actions">
        <button className="btn" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="btn primary"
          onClick={() => {
            onSave(text);
            onClose();
          }}
        >
          Guardar
        </button>
      </div>
    </Modal>
  );
}

export function Setup({ host, onBack, onStart }: { host: HostGame; onBack: () => void; onStart: () => void }) {
  const { config, setConfig, teams, setTeams, pool, customRaw, room } = host;
  const [editCustom, setEditCustom] = useState(false);
  const set = <K extends keyof GameConfig>(key: K, value: GameConfig[K]) => setConfig({ ...config, [key]: value });
  const needed = minDeckSize(teams.length, config.cardsToWin);
  const customCount = useMemo(() => parseSongLines(customRaw, true).songs.length, [customRaw]);
  const onlineByTeam = (teamId: string) => room.players.filter((p) => p.teamId === teamId).map((p) => p.name);

  const activeDecades = DECADES.filter((d) => d + 9 >= config.yearFrom && d <= config.yearTo);
  const pickDecade = (d: number) => {
    // Clic en una década: si ya es el único rango, vuelve a «todas»; si no, amplía/ajusta el rango.
    if (config.yearFrom === d && config.yearTo === d + 9) return setConfig({ ...config, yearFrom: 1950, yearTo: THIS_YEAR });
    if (activeDecades.length === DECADES.length) return setConfig({ ...config, yearFrom: d, yearTo: d + 9 });
    setConfig({ ...config, yearFrom: Math.min(config.yearFrom, d), yearTo: Math.max(config.yearTo, Math.min(d + 9, THIS_YEAR)) });
  };

  return (
    <div className="stack">
      <div className="row spread">
        <button className="btn sm ghost" onClick={onBack}>
          ← Volver
        </button>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Nueva partida</h1>
        <span style={{ width: 70 }} />
      </div>

      <div className="setup-grid">
        <div className="stack">
          <section className="panel stack">
            <div className="row spread">
              <h2 style={{ margin: 0 }}>👥 Equipos</h2>
              <button className="btn sm" onClick={() => setTeams([...teams, newTeam(teams)])} disabled={teams.length >= 8}>
                + Equipo
              </button>
            </div>
            <p className="muted small" style={{ margin: 0 }}>
              Jugad por equipos o crea un «equipo» por persona para jugar individualmente.
            </p>
            {teams.map((t, i) => (
              <TeamEditor
                key={t.id}
                team={t}
                canRemove={teams.length > 1}
                onlinePlayers={onlineByTeam(t.id)}
                onChange={(nt) => setTeams(teams.map((x, j) => (j === i ? nt : x)))}
                onRemove={() => setTeams(teams.filter((_, j) => j !== i))}
              />
            ))}
          </section>
          <RoomPanel host={host} />
        </div>

        <div className="stack">
          <section className="panel stack">
            <h2>🎵 Música</h2>
            <div className="field">
              <span>Origen de las canciones</span>
              <div className="chips">
                {(
                  [
                    ['catalog', 'Catálogo'],
                    ['custom', `Mis canciones (${customCount})`],
                    ['both', 'Ambos'],
                  ] as [SongSource, string][]
                ).map(([v, label]) => (
                  <button key={v} className={`chip${config.source === v ? ' on' : ''}`} onClick={() => set('source', v)}>
                    {label}
                  </button>
                ))}
                <button className="chip" onClick={() => setEditCustom(true)}>
                  ✎ Editar mis canciones
                </button>
              </div>
            </div>
            <div className="field">
              <span>Décadas</span>
              <div className="chips">
                {DECADES.map((d) => (
                  <button key={d} className={`chip${activeDecades.includes(d) ? ' on' : ''}`} onClick={() => pickDecade(d)}>
                    {String(d).slice(2)}s
                  </button>
                ))}
              </div>
              <div className="row">
                <label className="field" style={{ flex: 1 }}>
                  <span>Desde</span>
                  <input
                    type="number"
                    min={1950}
                    max={config.yearTo}
                    value={config.yearFrom}
                    onChange={(e) => set('yearFrom', Number(e.target.value) || 1950)}
                  />
                </label>
                <label className="field" style={{ flex: 1 }}>
                  <span>Hasta</span>
                  <input
                    type="number"
                    min={config.yearFrom}
                    max={THIS_YEAR}
                    value={config.yearTo}
                    onChange={(e) => set('yearTo', Number(e.target.value) || THIS_YEAR)}
                  />
                </label>
              </div>
            </div>
            {config.source !== 'custom' && (
              <>
                <div className="field">
                  <span>Estilos {config.genres.length === 0 && '(todos)'}</span>
                  <div className="chips">
                    {Object.entries(GENRES).map(([k, label]) => (
                      <button key={k} className={`chip${config.genres.includes(k) ? ' on' : ''}`} onClick={() => set('genres', toggle(config.genres, k))}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <span>Países {config.countries.length === 0 && '(todos)'}</span>
                  <div className="chips">
                    {COUNTRY_PRESETS.map((p) => {
                      const on = p.countries.length === config.countries.length && p.countries.every((c) => config.countries.includes(c));
                      return (
                        <button key={p.label} className={`chip${on ? ' on' : ''}`} onClick={() => set('countries', p.countries)}>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  <details>
                    <summary className="small muted" style={{ cursor: 'pointer', padding: '6px 0' }}>
                      Elegir países uno a uno
                    </summary>
                    <div className="chips">
                      {Object.entries(COUNTRIES).map(([k, label]) => (
                        <button key={k} className={`chip${config.countries.includes(k) ? ' on' : ''}`} onClick={() => set('countries', toggle(config.countries, k))}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              </>
            )}
            <div className={`notice${pool.length < needed ? ' error' : ''}`}>
              {pool.length} canciones disponibles con estos filtros
              {pool.length < needed && ` · se necesitan al menos ${needed}: amplía años, estilos o países, o baja las cartas para ganar`}
            </div>
          </section>

          <section className="panel stack">
            <h2>⚙️ Reglas</h2>
            <div className="row spread">
              <span>Cartas para ganar</span>
              <Stepper value={config.cardsToWin} min={3} max={20} onChange={(v) => set('cardsToWin', v)} />
            </div>
            <div className="row spread">
              <span>Fichas iniciales</span>
              <Stepper value={config.startingTokens} min={0} max={config.maxTokens} onChange={(v) => set('startingTokens', v)} />
            </div>
            <div className="row spread">
              <span>Tiempo por turno</span>
              <Stepper
                value={config.turnSeconds}
                min={0}
                max={180}
                step={15}
                onChange={(v) => set('turnSeconds', v)}
                format={(v) => (v === 0 ? '∞' : `${v}s`)}
              />
            </div>
            <div className="row spread">
              <span>
                Margen de años
                <br />
                <span className="muted small">Modo fácil: acepta fallos de ±N años</span>
              </span>
              <Stepper value={config.yearTolerance} min={0} max={5} onChange={(v) => set('yearTolerance', v)} format={(v) => (v === 0 ? 'Exacto' : `±${v}`)} />
            </div>
            <label className="toggle">
              <span>
                Desafíos
                <br />
                <span className="muted small">Otros equipos pueden gastar una ficha para robar la carta</span>
              </span>
              <input type="checkbox" checked={config.challenges} onChange={(e) => set('challenges', e.target.checked)} />
            </label>
          </section>
        </div>
      </div>

      <div className="sticky-start">
        <button className="btn primary big block" disabled={pool.length < needed || teams.length === 0} onClick={onStart}>
          ¡Empezar partida!
        </button>
      </div>

      {editCustom && <CustomSongsModal value={customRaw} onSave={host.setCustomRaw} onClose={() => setEditCustom(false)} />}
    </div>
  );
}
