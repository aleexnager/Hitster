export interface Song {
  id: string;
  title: string;
  artist: string;
  year: number;
  genres: string[];
  countries: string[];
  custom?: boolean;
}

export type SongSource = 'catalog' | 'custom' | 'both';

export interface GameConfig {
  yearFrom: number;
  yearTo: number;
  /** Vacío = todos los géneros. */
  genres: string[];
  /** Vacío = todos los países. */
  countries: string[];
  source: SongSource;
  cardsToWin: number;
  startingTokens: number;
  maxTokens: number;
  /** Permite a otros equipos desafiar la colocación gastando una ficha. */
  challenges: boolean;
  /** 0 = sin límite de tiempo. */
  turnSeconds: number;
  /** Margen de años aceptado al colocar una carta (0 = exacto). */
  yearTolerance: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  members: string[];
  tokens: number;
}

export type Phase = 'turn' | 'challenge' | 'reveal' | 'finished';

export interface Challenge {
  teamId: string;
  slot: number;
}

export interface RevealResult {
  activeCorrect: boolean;
  /** Equipo que se queda la carta (activo o desafiante), o null si se descarta. */
  awardedTo: string | null;
  correctSlots: number[];
  challengeResults: { teamId: string; correct: boolean }[];
  timedOut: boolean;
}

export interface GameState {
  config: GameConfig;
  teams: Team[];
  timelines: Record<string, Song[]>;
  deck: Song[];
  /** Solo presente en vistas redactadas (invitados), donde `deck` va vacío. */
  deckLeft?: number;
  current: Song | null;
  activeIdx: number;
  phase: Phase;
  slot: number | null;
  challenges: Challenge[];
  result: RevealResult | null;
  bonusGiven: boolean;
  winnerIds: string[];
  turn: number;
  /** Epoch ms en el que vence el turno; null sin temporizador. */
  deadline: number | null;
}

export type GameAction =
  | { type: 'SELECT_SLOT'; slot: number }
  | { type: 'CONFIRM' }
  | { type: 'SKIP'; free?: boolean }
  | { type: 'BUY_CARD' }
  | { type: 'CHALLENGE'; teamId: string; slot: number }
  | { type: 'CANCEL_CHALLENGE'; teamId: string }
  | { type: 'REVEAL' }
  | { type: 'BONUS' }
  | { type: 'NEXT'; now: number }
  | { type: 'TIMEOUT' };
