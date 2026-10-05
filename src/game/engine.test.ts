import { describe, expect, it } from 'vitest';
import {
  canPerform,
  createGame,
  DEFAULT_CONFIG,
  filterSongs,
  gameReducer,
  insertSorted,
  isSlotCorrect,
  redactForGuests,
} from './engine';
import type { GameConfig, GameState, Song } from './types';

const song = (year: number, id = `s${year}`): Song => ({
  id,
  title: `T${year}`,
  artist: `A${year}`,
  year,
  genres: ['pop'],
  countries: ['ES'],
});

const teams = [
  { id: 'a', name: 'A', color: '#f00', members: [] },
  { id: 'b', name: 'B', color: '#0f0', members: [] },
];

function setup(deckYears: number[], cfg: Partial<GameConfig> = {}): GameState {
  return createGame({ ...DEFAULT_CONFIG, ...cfg }, teams, deckYears.map((y, i) => song(y, `s${i}`)), 0);
}

describe('colocación', () => {
  const tl = [song(1970), song(1990)];
  it('valida huecos en extremos y entre cartas', () => {
    expect(isSlotCorrect(tl, 0, song(1960))).toBe(true);
    expect(isSlotCorrect(tl, 1, song(1980))).toBe(true);
    expect(isSlotCorrect(tl, 2, song(2000))).toBe(true);
    expect(isSlotCorrect(tl, 0, song(1980))).toBe(false);
  });
  it('acepta años iguales a ambos lados', () => {
    expect(isSlotCorrect(tl, 0, song(1970))).toBe(true);
    expect(isSlotCorrect(tl, 1, song(1970))).toBe(true);
  });
  it('aplica la tolerancia', () => {
    expect(isSlotCorrect(tl, 0, song(1972), 2)).toBe(true);
    expect(isSlotCorrect(tl, 0, song(1973), 2)).toBe(false);
  });
  it('inserta ordenado', () => {
    expect(insertSorted(tl, song(1980)).map((s) => s.year)).toEqual([1970, 1980, 1990]);
  });
});

describe('flujo de turno', () => {
  it('reparte una carta inicial por equipo', () => {
    const s = setup([1980, 1990, 2000, 1970]);
    expect(s.timelines.a.map((x) => x.year)).toEqual([1980]);
    expect(s.timelines.b.map((x) => x.year)).toEqual([1990]);
    expect(s.current?.year).toBe(2000);
    expect(s.phase).toBe('turn');
  });

  it('acierto sin desafíos: la carta va al equipo activo', () => {
    let s = setup([1980, 1990, 2000, 1970], { challenges: false });
    s = gameReducer(s, { type: 'SELECT_SLOT', slot: 1 });
    s = gameReducer(s, { type: 'CONFIRM' });
    expect(s.phase).toBe('reveal');
    expect(s.result?.activeCorrect).toBe(true);
    expect(s.timelines.a.map((x) => x.year)).toEqual([1980, 2000]);
    s = gameReducer(s, { type: 'NEXT', now: 0 });
    expect(s.activeIdx).toBe(1);
    expect(s.current?.year).toBe(1970);
  });

  it('desafío correcto: la carta va al desafiante y cuesta ficha', () => {
    let s = setup([1980, 1990, 2000, 1970]);
    s = gameReducer(s, { type: 'SELECT_SLOT', slot: 0 });
    s = gameReducer(s, { type: 'CONFIRM' });
    expect(s.phase).toBe('challenge');
    s = gameReducer(s, { type: 'CHALLENGE', teamId: 'b', slot: 1 });
    expect(s.teams[1].tokens).toBe(DEFAULT_CONFIG.startingTokens - 1);
    // No se puede desafiar el mismo hueco que el activo
    expect(gameReducer(s, { type: 'CHALLENGE', teamId: 'b', slot: 0 })).toBe(s);
    s = gameReducer(s, { type: 'REVEAL' });
    expect(s.result?.activeCorrect).toBe(false);
    expect(s.result?.awardedTo).toBe('b');
    expect(s.timelines.b.map((x) => x.year)).toEqual([1990, 2000]);
    expect(s.timelines.a.map((x) => x.year)).toEqual([1980]);
  });

  it('saltar cuesta ficha y comprar carta cuesta 3', () => {
    let s = setup([1980, 1990, 2000, 1970, 1960, 1950], { startingTokens: 4 });
    s = gameReducer(s, { type: 'SKIP' });
    expect(s.current?.year).toBe(1970);
    expect(s.teams[0].tokens).toBe(3);
    s = gameReducer(s, { type: 'BUY_CARD' });
    expect(s.teams[0].tokens).toBe(0);
    expect(s.timelines.a.map((x) => x.year)).toEqual([1960, 1980]);
    // Sin fichas no puede saltar, salvo salto gratuito (audio no disponible)
    expect(gameReducer(s, { type: 'SKIP' })).toBe(s);
    expect(gameReducer(s, { type: 'SKIP', free: true }).current?.year).toBe(1950);
  });

  it('tiempo agotado sin colocar = fallo', () => {
    let s = setup([1980, 1990, 2000, 1970]);
    s = gameReducer(s, { type: 'TIMEOUT' });
    expect(s.phase).toBe('reveal');
    expect(s.result?.timedOut).toBe(true);
    expect(s.result?.awardedTo).toBeNull();
  });

  it('bonus +1 ficha una sola vez y con tope', () => {
    let s = setup([1980, 1990, 2000, 1970], { challenges: false, startingTokens: 5 });
    s = gameReducer(gameReducer(s, { type: 'SELECT_SLOT', slot: 1 }), { type: 'CONFIRM' });
    s = gameReducer(s, { type: 'BONUS' });
    expect(s.teams[0].tokens).toBe(5);
    expect(s.bonusGiven).toBe(true);
  });

  it('gana quien llega a las cartas objetivo', () => {
    let s = setup([1980, 1990, 2000, 1970], { challenges: false, cardsToWin: 2 });
    s = gameReducer(gameReducer(s, { type: 'SELECT_SLOT', slot: 1 }), { type: 'CONFIRM' });
    s = gameReducer(s, { type: 'NEXT', now: 0 });
    expect(s.phase).toBe('finished');
    expect(s.winnerIds).toEqual(['a']);
  });

  it('si se acaba el mazo gana quien más cartas tiene', () => {
    let s = setup([1980, 1990, 2000], { challenges: false });
    s = gameReducer(gameReducer(s, { type: 'SELECT_SLOT', slot: 1 }), { type: 'CONFIRM' });
    s = gameReducer(s, { type: 'NEXT', now: 0 });
    expect(s.phase).toBe('finished');
    expect(s.winnerIds).toEqual(['a']);
  });
});

describe('permisos y redacción', () => {
  it('los invitados solo actúan por su equipo', () => {
    const s = setup([1980, 1990, 2000, 1970]);
    expect(canPerform(s, { type: 'SELECT_SLOT', slot: 0 }, 'a')).toBe(true);
    expect(canPerform(s, { type: 'SELECT_SLOT', slot: 0 }, 'b')).toBe(false);
    expect(canPerform(s, { type: 'CHALLENGE', teamId: 'a', slot: 0 }, 'b')).toBe(false);
    expect(canPerform(s, { type: 'NEXT', now: 0 }, 'a')).toBe(false);
    expect(canPerform(s, { type: 'SKIP', free: true }, 'a')).toBe(false);
    expect(canPerform(s, { type: 'NEXT', now: 0 }, null)).toBe(true);
  });
  it('oculta la carta en juego y el mazo', () => {
    const s = setup([1980, 1990, 2000, 1970]);
    const r = redactForGuests(s);
    expect(r.current?.year).toBe(0);
    expect(r.deck).toEqual([]);
    expect(r.deckLeft).toBe(1);
  });
});

describe('filtros', () => {
  const songs = [
    { ...song(1965, 'x'), genres: ['rock'], countries: ['GB'] },
    { ...song(1985, 'y'), genres: ['pop'], countries: ['ES'] },
    { ...song(2005, 'z'), genres: ['urbano'], countries: ['PR'], custom: true },
  ];
  it('filtra por años, género y país', () => {
    const cfg = { ...DEFAULT_CONFIG, yearFrom: 1960, yearTo: 1990 };
    expect(filterSongs(songs, cfg).map((s) => s.id)).toEqual(['x', 'y']);
    expect(filterSongs(songs, { ...cfg, genres: ['rock'] }).map((s) => s.id)).toEqual(['x']);
    expect(filterSongs(songs, { ...cfg, countries: ['ES'] }).map((s) => s.id)).toEqual(['y']);
  });
  it('las canciones propias ignoran género/país', () => {
    expect(filterSongs(songs, { ...DEFAULT_CONFIG, genres: ['rock'] }).map((s) => s.id)).toEqual(['x', 'z']);
  });
});
