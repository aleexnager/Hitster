import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { resolvePreview } from '../audio/preview';
import { activeTeam, BUY_CARD_COST, canPerform, deckLeft } from '../game/engine';
import type { GameAction, GameState, Song, Team } from '../game/types';
import { Modal } from './Modal';
import { Player, prefetch, stopAudio } from './Player';
import { Scoreboard, Tokens } from './Scoreboard';
import { Timeline, type SlotMark } from './Timeline';

interface Props {
  game: GameState;
  /** null = dispositivo anfitrión (control total). */
  myTeamId: string | null;
  isHost: boolean;
  dispatch: (action: GameAction) => void;
  onExit: () => void;
  onRematch?: () => void;
  extraMembers?: Record<string, string[]>;
}

function Artwork({ song }: { song: Song }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    resolvePreview(song).then((p) => !cancelled && setSrc(p?.artwork ?? null));
    return () => {
      cancelled = true;
    };
  }, [song.id]);
  return src ? <img src={src} alt="" /> : null;
}

function useCountdown(deadline: number | null): number | null {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [deadline]);
  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
}

export function GameView({ game, myTeamId, isHost, dispatch, onExit, onRematch, extraMembers }: Props) {
  const active = activeTeam(game);
  const [viewTeam, setViewTeam] = useState<string | null>(null);
  const [challenger, setChallenger] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const secondsLeft = useCountdown(game.phase === 'turn' ? game.deadline : null);
  const can = (a: GameAction) => canPerform(game, a, myTeamId);
  const membersOf = (t: Team) => [...t.members, ...(extraMembers?.[t.id] ?? [])];
  const teamById = useMemo(() => Object.fromEntries(game.teams.map((t) => [t.id, t])), [game.teams]);

  useEffect(() => setChallenger(null), [game.phase, game.turn]);
  useEffect(() => {
    if (isHost) prefetch(game.deck[0]);
  }, [isHost, game.deck]);
  useEffect(() => {
    if (game.phase === 'finished') stopAudio();
  }, [game.phase]);

  const timeline = game.timelines[active.id];
  const isMyTurn = myTeamId === null || myTeamId === active.id;

  const marks: SlotMark[] = game.challenges.map((c) => ({
    slot: c.slot,
    label: teamById[c.teamId]?.name ?? '?',
    color: teamById[c.teamId]?.color ?? '#fff',
  }));
  if (game.phase !== 'turn' && game.slot !== null) {
    marks.unshift({ slot: game.slot, label: active.name, color: active.color });
  }

  const challengers = game.teams.filter((t) => t.id !== active.id);

  if (game.phase === 'finished') {
    const winners = game.winnerIds.map((id) => teamById[id]).filter(Boolean);
    return (
      <div className="stage">
        <div className="podium">
          <div className="trophy">🏆</div>
          <h1>{winners.length > 1 ? '¡Empate!' : `¡Gana ${winners[0]?.name}!`}</h1>
          {winners.length > 1 && <p>{winners.map((w) => w.name).join(' y ')}</p>}
          <p className="muted">{game.turn} turnos jugados</p>
          {isHost && (
            <div className="actions">
              {onRematch && (
                <button className="btn primary big" onClick={onRematch}>
                  Revancha
                </button>
              )}
              <button className="btn big" onClick={onExit}>
                Nueva partida
              </button>
            </div>
          )}
        </div>
        {[...game.teams]
          .sort((a, b) => game.timelines[b.id].length - game.timelines[a.id].length)
          .map((t) => (
            <section key={t.id} className="panel" style={{ borderColor: t.color }}>
              <h2>
                <span className="color-dot" style={{ background: t.color }} /> {t.name} · {game.timelines[t.id].length} cartas
              </h2>
              <Timeline cards={game.timelines[t.id]} />
            </section>
          ))}
        {!isHost && (
          <button className="btn" onClick={onExit}>
            Salir
          </button>
        )}
      </div>
    );
  }

  const result = game.result;
  const awarded = result?.awardedTo ? teamById[result.awardedTo] : null;
  const selectingChallenge = game.phase === 'challenge' && challenger !== null;

  const onSlot = (slot: number) => {
    if (game.phase === 'turn') dispatch({ type: 'SELECT_SLOT', slot });
    else if (selectingChallenge) {
      dispatch({ type: 'CHALLENGE', teamId: challenger!, slot });
      setChallenger(null);
    }
  };

  const timelineSelectable =
    (game.phase === 'turn' && can({ type: 'SELECT_SLOT', slot: 0 })) || selectingChallenge;

  return (
    <div className="stage">
      <div className="topbar">
        <span className="muted small">
          Turno {game.turn} · {deckLeft(game)} cartas en el mazo
        </span>
        <div className="row">
          {secondsLeft !== null && <span className={`timer${secondsLeft <= 10 ? ' low' : ''}`}>⏱ {secondsLeft}s</span>}
          <button className="btn sm ghost" onClick={() => setConfirmExit(true)}>
            Salir
          </button>
        </div>
      </div>

      <Scoreboard game={game} onSelect={setViewTeam} extraMembers={extraMembers} />

      <div className="turn-banner" style={{ '--team': active.color } as CSSProperties}>
        <span className="muted small">Turno de</span>
        <h2 style={{ color: active.color }}>{active.name}</h2>
        {membersOf(active).length > 0 && <span className="muted small">{membersOf(active).join(' · ')}</span>}
        {myTeamId && myTeamId === active.id && game.phase === 'turn' && <p className="verdict ok">¡Os toca!</p>}
      </div>

      {game.phase !== 'reveal' && game.current &&
        (isHost ? (
          <Player song={game.current} onMissing={() => dispatch({ type: 'SKIP', free: true })} />
        ) : (
          <div className="player">
            <div className="vinyl spin" />
            <span className="muted small">La música suena en el dispositivo anfitrión</span>
          </div>
        ))}

      {game.phase === 'reveal' && result && game.current && (
        <div className="stack">
          <div className="reveal">
            <Artwork song={game.current} />
            <div>
              <div className="big-year">{game.current.year}</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{game.current.title}</div>
              <div className="muted">{game.current.artist}</div>
            </div>
          </div>
          <p className={`verdict ${awarded ? 'ok' : 'bad'}`}>
            {result.timedOut
              ? '⏱ ¡Se acabó el tiempo!'
              : result.activeCorrect
                ? `✔ ¡Correcto! ${active.name} se queda la carta`
                : awarded
                  ? `⚔ ¡Desafío ganado! ${awarded.name} se queda la carta`
                  : '✘ Fallo: la carta se descarta'}
          </p>
        </div>
      )}

      {game.phase === 'turn' && (
        <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>
          {isMyTurn
            ? 'Toca el hueco donde creéis que va la canción y confirmad.'
            : `Esperando a que ${active.name} coloque la carta…`}
        </p>
      )}
      {game.phase === 'challenge' && (
        <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>
          {selectingChallenge
            ? `${teamById[challenger!].name}: toca el hueco donde creéis que va realmente.`
            : '¿Algún equipo cree que está mal colocada? Desafiar cuesta 1 ficha.'}
        </p>
      )}

      <Timeline
        cards={timeline}
        selectable={timelineSelectable}
        selectedSlot={game.phase === 'turn' ? game.slot : null}
        onSelect={onSlot}
        marks={game.phase === 'turn' ? [] : marks}
        correctSlots={game.phase === 'reveal' ? result?.correctSlots : undefined}
        revealSlot={game.phase === 'reveal' ? game.slot : null}
        newCardId={game.phase === 'reveal' && result?.awardedTo === active.id ? game.current?.id : null}
      />

      {game.phase === 'turn' && (
        <div className="actions">
          {can({ type: 'CONFIRM' }) && (
            <button className="btn primary big" disabled={game.slot === null} onClick={() => dispatch({ type: 'CONFIRM' })}>
              Confirmar posición
            </button>
          )}
          {can({ type: 'SKIP' }) && (
            <button className="btn" disabled={active.tokens < 1 || deckLeft(game) === 0} onClick={() => dispatch({ type: 'SKIP' })}>
              Saltar canción · 1 ●
            </button>
          )}
          {can({ type: 'BUY_CARD' }) && (
            <button
              className="btn"
              disabled={active.tokens < BUY_CARD_COST || deckLeft(game) === 0}
              onClick={() => dispatch({ type: 'BUY_CARD' })}
            >
              Comprar carta · {BUY_CARD_COST} ●
            </button>
          )}
        </div>
      )}

      {game.phase === 'challenge' && (
        <div className="stack" style={{ alignItems: 'center' }}>
          <div className="challenge-list">
            {challengers.map((t) => {
              const existing = game.challenges.find((c) => c.teamId === t.id);
              const allowed = can({ type: 'CHALLENGE', teamId: t.id, slot: 0 });
              if (!allowed) return null;
              if (existing)
                return (
                  <button key={t.id} className="btn sm" onClick={() => dispatch({ type: 'CANCEL_CHALLENGE', teamId: t.id })}>
                    <span className="color-dot" style={{ background: t.color }} /> {t.name}: retirar desafío
                  </button>
                );
              return (
                <button
                  key={t.id}
                  className={`btn sm${challenger === t.id ? ' secondary' : ''}`}
                  disabled={t.tokens < 1}
                  onClick={() => setChallenger(challenger === t.id ? null : t.id)}
                >
                  <span className="color-dot" style={{ background: t.color }} /> {t.name} desafía <Tokens n={t.tokens} />
                </button>
              );
            })}
          </div>
          {isHost ? (
            <button className="btn primary big" onClick={() => dispatch({ type: 'REVEAL' })}>
              Revelar
            </button>
          ) : (
            <span className="muted small">El anfitrión revelará la carta.</span>
          )}
        </div>
      )}

      {game.phase === 'reveal' && (
        <div className="actions">
          {isHost && result && !result.timedOut && (
            <button className="btn" disabled={game.bonusGiven || active.tokens >= game.config.maxTokens} onClick={() => dispatch({ type: 'BONUS' })}>
              {game.bonusGiven ? '✔ Ficha extra dada' : `¿${active.name} acertó título y artista? +1 ●`}
            </button>
          )}
          {isHost ? (
            <button className="btn primary big" onClick={() => dispatch({ type: 'NEXT', now: Date.now() })}>
              Siguiente turno
            </button>
          ) : (
            <span className="muted small">Esperando al anfitrión…</span>
          )}
        </div>
      )}

      {viewTeam && teamById[viewTeam] && (
        <Modal title={`Línea del tiempo · ${teamById[viewTeam].name}`} onClose={() => setViewTeam(null)}>
          <p className="muted small">
            {membersOf(teamById[viewTeam]).join(' · ') || 'Sin jugadores asignados'} · <Tokens n={teamById[viewTeam].tokens} />
          </p>
          <Timeline cards={game.timelines[viewTeam]} />
        </Modal>
      )}

      {confirmExit && (
        <Modal title="¿Salir de la partida?" onClose={() => setConfirmExit(false)}>
          <p>{isHost ? 'Se terminará la partida para todos los jugadores.' : 'Podrás volver a unirte con el mismo código.'}</p>
          <div className="actions">
            <button className="btn" onClick={() => setConfirmExit(false)}>
              Seguir jugando
            </button>
            <button
              className="btn primary"
              onClick={() => {
                stopAudio();
                setConfirmExit(false);
                onExit();
              }}
            >
              Salir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
