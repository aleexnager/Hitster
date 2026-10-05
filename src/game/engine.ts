import type { Challenge, GameAction, GameConfig, GameState, RevealResult, Song, Team } from './types';

export const BUY_CARD_COST = 3;

export const DEFAULT_CONFIG: GameConfig = {
  yearFrom: 1950,
  yearTo: new Date().getFullYear(),
  genres: [],
  countries: [],
  source: 'catalog',
  cardsToWin: 10,
  startingTokens: 2,
  maxTokens: 5,
  challenges: true,
  turnSeconds: 0,
  yearTolerance: 0,
};

/** Cartas mínimas para poder arrancar: una inicial por equipo + margen de juego. */
export function minDeckSize(teamCount: number, cardsToWin: number): number {
  return teamCount * cardsToWin + 5;
}

/** Inserta respetando el orden cronológico (estable: tras los del mismo año). */
export function insertSorted(timeline: Song[], song: Song): Song[] {
  const idx = timeline.findIndex((s) => s.year > song.year);
  const copy = timeline.slice();
  copy.splice(idx === -1 ? copy.length : idx, 0, song);
  return copy;
}

/** ¿Es correcto colocar `song` en el hueco `slot` (0 = antes de la primera carta)? */
export function isSlotCorrect(timeline: Song[], slot: number, song: Song, tolerance = 0): boolean {
  if (slot < 0 || slot > timeline.length) return false;
  const left = slot > 0 ? timeline[slot - 1].year : -Infinity;
  const right = slot < timeline.length ? timeline[slot].year : Infinity;
  return song.year >= left - tolerance && song.year <= right + tolerance;
}

export function correctSlots(timeline: Song[], song: Song, tolerance = 0): number[] {
  const slots: number[] = [];
  for (let i = 0; i <= timeline.length; i++) if (isSlotCorrect(timeline, i, song, tolerance)) slots.push(i);
  return slots;
}

export function activeTeam(state: GameState): Team {
  return state.teams[state.activeIdx];
}

export function createGame(
  config: GameConfig,
  teams: Omit<Team, 'tokens'>[],
  shuffledDeck: Song[],
  now: number,
): GameState {
  const deck = shuffledDeck.slice();
  const timelines: Record<string, Song[]> = {};
  for (const t of teams) timelines[t.id] = deck.length ? [deck.shift()!] : [];
  const current = deck.shift() ?? null;
  return {
    config,
    teams: teams.map((t) => ({ ...t, tokens: config.startingTokens })),
    timelines,
    deck,
    current,
    activeIdx: 0,
    phase: current ? 'turn' : 'finished',
    slot: null,
    challenges: [],
    result: null,
    bonusGiven: false,
    winnerIds: [],
    turn: 1,
    deadline: config.turnSeconds > 0 ? now + config.turnSeconds * 1000 : null,
  };
}

function updateTeam(state: GameState, teamId: string, fn: (t: Team) => Team): Team[] {
  return state.teams.map((t) => (t.id === teamId ? fn(t) : t));
}

function reveal(state: GameState, timedOut: boolean): GameState {
  const song = state.current;
  if (!song) return state;
  const active = activeTeam(state);
  const timeline = state.timelines[active.id];
  const tol = state.config.yearTolerance;
  const activeCorrect = state.slot !== null && !timedOut && isSlotCorrect(timeline, state.slot, song, tol);
  const challengeResults = state.challenges.map((c) => ({
    teamId: c.teamId,
    correct: isSlotCorrect(timeline, c.slot, song, tol),
  }));
  const awardedTo = activeCorrect ? active.id : (challengeResults.find((c) => c.correct)?.teamId ?? null);
  const result: RevealResult = {
    activeCorrect,
    awardedTo,
    correctSlots: correctSlots(timeline, song, tol),
    challengeResults,
    timedOut,
  };
  const timelines = awardedTo
    ? { ...state.timelines, [awardedTo]: insertSorted(state.timelines[awardedTo], song) }
    : state.timelines;
  return { ...state, phase: 'reveal', result, timelines, deadline: null };
}

function computeWinners(state: GameState, deckExhausted: boolean): string[] {
  const reached = state.teams.filter((t) => state.timelines[t.id].length >= state.config.cardsToWin);
  if (reached.length) return reached.map((t) => t.id);
  if (!deckExhausted) return [];
  const max = Math.max(...state.teams.map((t) => state.timelines[t.id].length));
  return state.teams.filter((t) => state.timelines[t.id].length === max).map((t) => t.id);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const active = activeTeam(state);
  switch (action.type) {
    case 'SELECT_SLOT': {
      if (state.phase !== 'turn') return state;
      if (action.slot < 0 || action.slot > state.timelines[active.id].length) return state;
      return { ...state, slot: action.slot };
    }
    case 'CONFIRM': {
      if (state.phase !== 'turn' || state.slot === null) return state;
      const canBeChallenged =
        state.config.challenges && state.teams.some((t) => t.id !== active.id && t.tokens > 0);
      return canBeChallenged ? { ...state, phase: 'challenge', deadline: null } : reveal(state, false);
    }
    case 'TIMEOUT': {
      if (state.phase !== 'turn') return state;
      return reveal(state, state.slot === null);
    }
    case 'SKIP': {
      if (state.phase !== 'turn' || state.deck.length === 0) return state;
      if (!action.free && active.tokens < 1) return state;
      const [next, ...rest] = state.deck;
      return {
        ...state,
        teams: action.free ? state.teams : updateTeam(state, active.id, (t) => ({ ...t, tokens: t.tokens - 1 })),
        current: next,
        deck: rest,
        slot: null,
      };
    }
    case 'BUY_CARD': {
      if (state.phase !== 'turn' || active.tokens < BUY_CARD_COST || state.deck.length === 0) return state;
      const [bought, ...rest] = state.deck;
      return {
        ...state,
        teams: updateTeam(state, active.id, (t) => ({ ...t, tokens: t.tokens - BUY_CARD_COST })),
        timelines: { ...state.timelines, [active.id]: insertSorted(state.timelines[active.id], bought) },
        deck: rest,
        // El hueco elegido puede haberse desplazado al insertar la carta comprada.
        slot: null,
      };
    }
    case 'CHALLENGE': {
      if (state.phase !== 'challenge' || action.teamId === active.id) return state;
      const team = state.teams.find((t) => t.id === action.teamId);
      if (!team || team.tokens < 1) return state;
      if (action.slot < 0 || action.slot > state.timelines[active.id].length) return state;
      if (action.slot === state.slot) return state;
      if (state.challenges.some((c) => c.teamId === action.teamId || c.slot === action.slot)) return state;
      const challenge: Challenge = { teamId: action.teamId, slot: action.slot };
      return {
        ...state,
        teams: updateTeam(state, action.teamId, (t) => ({ ...t, tokens: t.tokens - 1 })),
        challenges: [...state.challenges, challenge],
      };
    }
    case 'CANCEL_CHALLENGE': {
      if (state.phase !== 'challenge' || !state.challenges.some((c) => c.teamId === action.teamId)) return state;
      return {
        ...state,
        teams: updateTeam(state, action.teamId, (t) => ({ ...t, tokens: t.tokens + 1 })),
        challenges: state.challenges.filter((c) => c.teamId !== action.teamId),
      };
    }
    case 'REVEAL': {
      if (state.phase !== 'challenge') return state;
      return reveal(state, false);
    }
    case 'BONUS': {
      if (state.phase !== 'reveal' || state.bonusGiven) return state;
      return {
        ...state,
        bonusGiven: true,
        teams: updateTeam(state, active.id, (t) => ({ ...t, tokens: Math.min(state.config.maxTokens, t.tokens + 1) })),
      };
    }
    case 'NEXT': {
      if (state.phase !== 'reveal') return state;
      const deckExhausted = state.deck.length === 0;
      const winnerIds = computeWinners(state, deckExhausted);
      if (winnerIds.length) return { ...state, phase: 'finished', winnerIds, current: null };
      const [next, ...rest] = state.deck;
      return {
        ...state,
        activeIdx: (state.activeIdx + 1) % state.teams.length,
        current: next,
        deck: rest,
        phase: 'turn',
        slot: null,
        challenges: [],
        result: null,
        bonusGiven: false,
        turn: state.turn + 1,
        deadline: state.config.turnSeconds > 0 ? action.now + state.config.turnSeconds * 1000 : null,
      };
    }
  }
}

/**
 * Quién puede lanzar cada acción. `actorTeamId` null = dispositivo anfitrión (mesa),
 * que puede hacerlo todo. Los invitados solo actúan en nombre de su equipo.
 */
export function canPerform(state: GameState, action: GameAction, actorTeamId: string | null): boolean {
  if (actorTeamId === null) return true;
  const isActive = activeTeam(state).id === actorTeamId;
  switch (action.type) {
    case 'SELECT_SLOT':
    case 'CONFIRM':
    case 'SKIP':
    case 'BUY_CARD':
      return isActive && !(action.type === 'SKIP' && action.free);
    case 'CHALLENGE':
    case 'CANCEL_CHALLENGE':
      return action.teamId === actorTeamId;
    default:
      return false;
  }
}

const HIDDEN_SONG: Song = { id: 'hidden', title: '???', artist: '???', year: 0, genres: [], countries: [] };

/** Vista para invitados: oculta la carta en juego hasta revelarla y el contenido del mazo. */
export function redactForGuests(state: GameState): GameState {
  const hide = state.current && (state.phase === 'turn' || state.phase === 'challenge');
  return {
    ...state,
    current: hide ? HIDDEN_SONG : state.current,
    deck: [],
    deckLeft: state.deck.length,
  };
}

export function deckLeft(state: GameState): number {
  return state.deckLeft ?? state.deck.length;
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function filterSongs(songs: Song[], config: GameConfig): Song[] {
  return songs.filter((s) => {
    if (s.year < config.yearFrom || s.year > config.yearTo) return false;
    if (s.custom) return true; // las canciones propias solo se filtran por año
    if (config.genres.length && !s.genres.some((g) => config.genres.includes(g))) return false;
    if (config.countries.length && !s.countries.some((c) => config.countries.includes(c))) return false;
    return true;
  });
}
