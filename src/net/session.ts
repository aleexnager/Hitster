import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import type { GameAction, GameState } from '../game/types';

/**
 * Salas online sin backend propio: WebRTC P2P con PeerJS. El anfitrión es la
 * fuente de verdad (aplica el reducer) y difunde el estado; los invitados solo
 * envían intenciones. El servidor de señalización por defecto es el público de
 * PeerJS; se puede apuntar a uno propio con VITE_PEER_HOST/PORT/PATH.
 */

const PREFIX = 'temazos-v1-';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface PlayerInfo {
  clientId: string;
  name: string;
  teamId: string | null;
  connected: boolean;
}

export interface LobbyTeam {
  id: string;
  name: string;
  color: string;
}

export interface SyncPayload {
  teams: LobbyTeam[];
  players: PlayerInfo[];
  game: GameState | null;
}

export type HostMessage = { t: 'sync'; data: SyncPayload } | { t: 'error'; message: string };

export type GuestMessage =
  | { t: 'hello'; clientId: string; name: string }
  | { t: 'pickTeam'; teamId: string }
  | { t: 'action'; action: GameAction };

export function generateCode(length = 4): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function peerOptions(): PeerOptions {
  const env = import.meta.env;
  const opts: PeerOptions = { debug: 1 };
  if (env.VITE_PEER_HOST) {
    opts.host = env.VITE_PEER_HOST;
    opts.port = Number(env.VITE_PEER_PORT ?? 443);
    opts.path = env.VITE_PEER_PATH ?? '/';
    opts.secure = env.VITE_PEER_SECURE ? env.VITE_PEER_SECURE === 'true' : opts.port === 443;
  }
  return opts;
}

export function getClientId(): string {
  const KEY = 'temazos.clientId';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export interface HostCallbacks {
  onHello(clientId: string, name: string): void;
  onPickTeam(clientId: string, teamId: string): void;
  onAction(clientId: string, action: GameAction): void;
  onDisconnect(clientId: string): void;
  onStatus(status: 'opening' | 'open' | 'error', detail?: string): void;
}

export class HostSession {
  readonly code: string;
  private peer: Peer | null = null;
  private conns = new Map<DataConnection, string | null>();
  private last: SyncPayload | null = null;
  private destroyed = false;

  constructor(
    private cb: HostCallbacks,
    code = generateCode(),
  ) {
    this.code = code;
    this.open(0);
  }

  private open(attempt: number) {
    this.cb.onStatus('opening');
    const peer = new Peer(PREFIX + this.code, peerOptions());
    this.peer = peer;
    peer.on('open', () => this.cb.onStatus('open'));
    peer.on('connection', (conn) => this.accept(conn));
    peer.on('disconnected', () => {
      if (!this.destroyed) peer.reconnect();
    });
    peer.on('error', (err) => {
      const type = (err as { type?: string }).type;
      if (type === 'unavailable-id' && attempt < 3) {
        // Código ocupado (p. ej. recarga rápida): reintentamos con el mismo código tras liberar
        peer.destroy();
        setTimeout(() => !this.destroyed && this.open(attempt + 1), 1500);
        return;
      }
      if (type === 'peer-unavailable') return; // invitado que se fue
      this.cb.onStatus('error', type ?? String(err));
    });
  }

  private accept(conn: DataConnection) {
    this.conns.set(conn, null);
    conn.on('data', (raw) => {
      const msg = raw as GuestMessage;
      if (msg.t === 'hello') {
        this.conns.set(conn, msg.clientId);
        this.cb.onHello(msg.clientId, String(msg.name).slice(0, 24));
        if (this.last) conn.send({ t: 'sync', data: this.last } satisfies HostMessage);
        return;
      }
      const clientId = this.conns.get(conn);
      if (!clientId) return;
      if (msg.t === 'pickTeam') this.cb.onPickTeam(clientId, msg.teamId);
      if (msg.t === 'action') this.cb.onAction(clientId, msg.action);
    });
    const drop = () => {
      const clientId = this.conns.get(conn);
      this.conns.delete(conn);
      if (clientId && ![...this.conns.values()].includes(clientId)) this.cb.onDisconnect(clientId);
    };
    conn.on('close', drop);
    conn.on('error', drop);
  }

  broadcast(data: SyncPayload) {
    this.last = data;
    const msg: HostMessage = { t: 'sync', data };
    for (const [conn, clientId] of this.conns) if (clientId && conn.open) conn.send(msg);
  }

  destroy() {
    this.destroyed = true;
    this.peer?.destroy();
  }
}

export type GuestStatus = 'connecting' | 'connected' | 'reconnecting' | 'not-found' | 'error';

export interface GuestCallbacks {
  onSync(data: SyncPayload): void;
  onStatus(status: GuestStatus, detail?: string): void;
}

export class GuestSession {
  private peer: Peer;
  private conn: DataConnection | null = null;
  private destroyed = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private everConnected = false;

  constructor(
    readonly code: string,
    private name: string,
    private cb: GuestCallbacks,
  ) {
    cb.onStatus('connecting');
    this.peer = new Peer(peerOptions());
    this.peer.on('open', () => this.connect());
    this.peer.on('disconnected', () => {
      if (!this.destroyed) this.peer.reconnect();
    });
    this.peer.on('error', (err) => {
      const type = (err as { type?: string }).type;
      if (type === 'peer-unavailable') {
        if (this.everConnected) this.scheduleRetry();
        else cb.onStatus('not-found');
        return;
      }
      if (type === 'network' || type === 'server-error' || type === 'socket-error') {
        this.scheduleRetry();
        return;
      }
      cb.onStatus('error', type ?? String(err));
    });
  }

  private connect() {
    if (this.destroyed) return;
    const conn = this.peer.connect(PREFIX + this.code, { reliable: true });
    this.conn = conn;
    conn.on('open', () => {
      this.everConnected = true;
      this.cb.onStatus('connected');
      conn.send({ t: 'hello', clientId: getClientId(), name: this.name } satisfies GuestMessage);
    });
    conn.on('data', (raw) => {
      const msg = raw as HostMessage;
      if (msg.t === 'sync') this.cb.onSync(msg.data);
    });
    conn.on('close', () => this.scheduleRetry());
    conn.on('error', () => this.scheduleRetry());
  }

  private scheduleRetry() {
    if (this.destroyed || this.retryTimer) return;
    this.cb.onStatus('reconnecting');
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this.peer.disconnected) this.peer.reconnect();
      else this.connect();
    }, 2000);
  }

  send(msg: GuestMessage) {
    if (this.conn?.open) this.conn.send(msg);
  }

  destroy() {
    this.destroyed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.peer.destroy();
  }
}
