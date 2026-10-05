import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG, parseSongLines } from '../data/catalog';
import { TEAM_COLORS } from '../data/taxonomy';
import { canPerform, createGame, DEFAULT_CONFIG, filterSongs, gameReducer, redactForGuests, shuffle } from '../game/engine';
import type { GameAction, GameConfig, GameState, Song } from '../game/types';
import { HostSession, type PlayerInfo } from '../net/session';
import { load, save } from '../storage';

export interface TeamDraft {
  id: string;
  name: string;
  color: string;
  members: string[];
}

export type RoomStatus = 'closed' | 'opening' | 'open' | 'error';

const K = {
  config: 'temazos.config',
  teams: 'temazos.teams',
  custom: 'temazos.customSongs',
  game: 'temazos.game',
  room: 'temazos.room',
};

const DEFAULT_TEAMS: TeamDraft[] = [
  { id: 't1', name: 'Equipo Rosa', color: TEAM_COLORS[0], members: [] },
  { id: 't2', name: 'Equipo Azul', color: TEAM_COLORS[1], members: [] },
];

export function newTeam(existing: TeamDraft[]): TeamDraft {
  const used = new Set(existing.map((t) => t.color));
  const color = TEAM_COLORS.find((c) => !used.has(c)) ?? TEAM_COLORS[existing.length % TEAM_COLORS.length];
  return { id: `t${Date.now().toString(36)}`, name: `Equipo ${existing.length + 1}`, color, members: [] };
}

export function buildPool(config: GameConfig, customRaw: string): Song[] {
  const custom = parseSongLines(customRaw, true).songs;
  const base = config.source === 'catalog' ? CATALOG : config.source === 'custom' ? custom : [...CATALOG, ...custom];
  return filterSongs(base, config);
}

interface RoomPersist {
  code: string;
  players: PlayerInfo[];
}

export function useHostGame() {
  const [config, setConfig] = useState<GameConfig>(() => ({ ...DEFAULT_CONFIG, ...load(K.config, {}) }));
  const [teams, setTeams] = useState<TeamDraft[]>(() => load(K.teams, DEFAULT_TEAMS));
  const [customRaw, setCustomRaw] = useState<string>(() => load(K.custom, ''));
  const [game, setGame] = useState<GameState | null>(() => load(K.game, null));
  const [players, setPlayers] = useState<PlayerInfo[]>(() => load<RoomPersist | null>(K.room, null)?.players ?? []);
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('closed');
  const [roomError, setRoomError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const session = useRef<HostSession | null>(null);
  const playersRef = useRef(players);
  playersRef.current = players;

  useEffect(() => save(K.config, config), [config]);
  useEffect(() => save(K.teams, teams), [teams]);
  useEffect(() => save(K.custom, customRaw), [customRaw]);
  useEffect(() => save(K.game, game), [game]);
  useEffect(() => save(K.room, code ? { code, players } : null), [code, players]);

  const pool = useMemo(() => buildPool(config, customRaw), [config, customRaw]);

  const openRoom = useCallback((reuseCode?: string) => {
    if (session.current) return;
    setRoomError(null);
    session.current = new HostSession(
      {
        onStatus: (status, detail) => {
          setRoomStatus(status);
          if (detail) setRoomError(detail);
        },
        onHello: (clientId, name) =>
          setPlayers((ps) => {
            const known = ps.find((p) => p.clientId === clientId);
            if (known) return ps.map((p) => (p.clientId === clientId ? { ...p, name, connected: true } : p));
            return [...ps, { clientId, name, teamId: null, connected: true }];
          }),
        onPickTeam: (clientId, teamId) =>
          setPlayers((ps) => ps.map((p) => (p.clientId === clientId ? { ...p, teamId: teamId || null } : p))),
        onDisconnect: (clientId) =>
          setPlayers((ps) => ps.map((p) => (p.clientId === clientId ? { ...p, connected: false } : p))),
        onAction: (clientId, action) => {
          const teamId = playersRef.current.find((p) => p.clientId === clientId)?.teamId;
          if (!teamId) return;
          setGame((g) => (g && canPerform(g, action, teamId) ? gameReducer(g, action) : g));
        },
      },
      reuseCode,
    );
    setCode(session.current.code);
  }, []);

  const closeRoom = useCallback(() => {
    session.current?.destroy();
    session.current = null;
    setCode(null);
    setRoomStatus('closed');
    setPlayers([]);
  }, []);

  // Si la página se recarga con una sala abierta, la reabrimos con el mismo código
  useEffect(() => {
    const persisted = load<RoomPersist | null>(K.room, null);
    if (persisted?.code) openRoom(persisted.code);
    return () => {
      session.current?.destroy();
      session.current = null;
    };
  }, [openRoom]);

  const lobbyTeams = game ? game.teams : teams;
  useEffect(() => {
    session.current?.broadcast({
      teams: lobbyTeams.map(({ id, name, color }) => ({ id, name, color })),
      players,
      game: game ? redactForGuests(game) : null,
    });
  }, [lobbyTeams, players, game, code]);

  const dispatch = useCallback((action: GameAction) => {
    setGame((g) => (g ? gameReducer(g, action) : g));
  }, []);

  // Temporizador del turno (solo el anfitrión decide cuándo vence)
  useEffect(() => {
    if (!game?.deadline || game.phase !== 'turn') return;
    const ms = Math.max(0, game.deadline - Date.now());
    const id = setTimeout(() => dispatch({ type: 'TIMEOUT' }), ms);
    return () => clearTimeout(id);
  }, [game?.deadline, game?.phase, dispatch]);

  const startGame = useCallback(() => {
    setGame(createGame(config, teams, shuffle(pool), Date.now()));
  }, [config, teams, pool]);

  const rematch = useCallback(() => {
    if (!game) return;
    setGame(createGame(game.config, game.teams, shuffle(buildPool(game.config, customRaw)), Date.now()));
  }, [game, customRaw]);

  const endGame = useCallback(() => setGame(null), []);

  const assignPlayer = useCallback((clientId: string, teamId: string | null) => {
    setPlayers((ps) => ps.map((p) => (p.clientId === clientId ? { ...p, teamId } : p)));
  }, []);

  const removePlayer = useCallback((clientId: string) => {
    setPlayers((ps) => ps.filter((p) => p.clientId !== clientId));
  }, []);

  return {
    config,
    setConfig,
    teams,
    setTeams,
    customRaw,
    setCustomRaw,
    pool,
    game,
    dispatch,
    startGame,
    rematch,
    endGame,
    room: { code, status: roomStatus, error: roomError, players, open: openRoom, close: closeRoom, assignPlayer, removePlayer },
  };
}

export type HostGame = ReturnType<typeof useHostGame>;
