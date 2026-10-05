import type { CSSProperties } from 'react';
import type { GameState } from '../game/types';

export function Tokens({ n }: { n: number }) {
  return <span className="tokens" aria-label={`${n} fichas`}>{n > 0 ? '●'.repeat(n) : '—'}</span>;
}

export function Scoreboard({ game, onSelect, extraMembers }: {
  game: GameState;
  onSelect?: (teamId: string) => void;
  extraMembers?: Record<string, string[]>;
}) {
  return (
    <div className="scoreboard">
      {game.teams.map((t, i) => {
        const count = game.timelines[t.id].length;
        const members = [...t.members, ...(extraMembers?.[t.id] ?? [])];
        return (
          <button
            key={t.id}
            type="button"
            className={`score${i === game.activeIdx && game.phase !== 'finished' ? ' active' : ''}`}
            style={{ '--team': t.color } as CSSProperties}
            onClick={() => onSelect?.(t.id)}
            title={members.join(', ')}
          >
            <span className="row" style={{ gap: 6 }}>
              <span className="color-dot" style={{ background: t.color }} />
              <span className="name">{t.name}</span>
            </span>
            <span className="row spread small">
              <strong>
                {count}/{game.config.cardsToWin}
              </strong>
              <Tokens n={t.tokens} />
            </span>
            <div className="progress">
              <div style={{ width: `${Math.min(100, (count / game.config.cardsToWin) * 100)}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
