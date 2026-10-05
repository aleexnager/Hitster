import type { Song } from '../game/types';

export interface Preview {
  url: string;
  artwork?: string;
  source: 'itunes' | 'deezer';
}

/**
 * Las APIs de iTunes y Deezer no exponen CORS de forma fiable, pero ambas
 * admiten JSONP, así que la búsqueda funciona sin backend propio.
 */
let jsonpSeq = 0;
function jsonp<T>(url: string, callbackParam: string, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const name = `__temazos_cb_${Date.now()}_${jsonpSeq++}`;
    const script = document.createElement('script');
    const w = window as unknown as Record<string, unknown>;
    const cleanup = () => {
      clearTimeout(timer);
      delete w[name];
      script.remove();
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, timeoutMs);
    w[name] = (data: T) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('network'));
    };
    script.src = `${url}${url.includes('?') ? '&' : '?'}${callbackParam}=${name}`;
    document.head.appendChild(script);
  });
}

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/feat\..*$|ft\..*$/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Primer artista de créditos tipo «A & B», «A, B y C», «A feat. B». */
function mainArtist(artist: string): string {
  return normalize(artist.split(/\s*(?:&|,| y | and | feat\.? | ft\.? )\s*/i)[0]);
}

export function matchScore(song: Song, title: string, artist: string): number {
  const wantTitle = normalize(song.title);
  const wantArtist = mainArtist(song.artist);
  const gotTitle = normalize(title);
  const gotArtist = normalize(artist);
  let score = 0;
  if (gotTitle === wantTitle) score += 3;
  else if (gotTitle.includes(wantTitle) || wantTitle.includes(gotTitle)) score += 2;
  if (gotArtist.includes(wantArtist) || wantArtist.includes(gotArtist)) score += 3;
  // Penaliza versiones que suelen sonar distinto o delatar el año
  if (/live|en vivo|en directo|karaoke|remaster|instrumental|cover|tribute/i.test(title)) score -= 1;
  return score;
}

interface ItunesResult {
  results: { trackName: string; artistName: string; previewUrl?: string; artworkUrl100?: string }[];
}
interface DeezerResult {
  data?: { title: string; preview?: string; artist: { name: string }; album?: { cover_big?: string } }[];
}

async function fromItunes(song: Song): Promise<Preview | null> {
  const term = encodeURIComponent(`${mainArtist(song.artist)} ${normalize(song.title)}`);
  const data = await jsonp<ItunesResult>(
    `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=15`,
    'callback',
  );
  const best = data.results
    .filter((r) => r.previewUrl)
    .map((r) => ({ r, score: matchScore(song, r.trackName, r.artistName) }))
    .sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 5) return null;
  return {
    url: best.r.previewUrl!,
    artwork: best.r.artworkUrl100?.replace('100x100', '600x600'),
    source: 'itunes',
  };
}

async function fromDeezer(song: Song): Promise<Preview | null> {
  const q = encodeURIComponent(`artist:"${mainArtist(song.artist)}" track:"${normalize(song.title)}"`);
  const data = await jsonp<DeezerResult>(`https://api.deezer.com/search?q=${q}&output=jsonp`, 'callback');
  const best = (data.data ?? [])
    .filter((r) => r.preview)
    .map((r) => ({ r, score: matchScore(song, r.title, r.artist.name) }))
    .sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 5) return null;
  return { url: best.r.preview!, artwork: best.r.album?.cover_big, source: 'deezer' };
}

const cache = new Map<string, Promise<Preview | null>>();

export function resolvePreview(song: Song): Promise<Preview | null> {
  let pending = cache.get(song.id);
  if (!pending) {
    pending = (async () => {
      for (const provider of [fromItunes, fromDeezer]) {
        try {
          const found = await provider(song);
          if (found) return found;
        } catch {
          // probamos el siguiente proveedor
        }
      }
      return null;
    })();
    cache.set(song.id, pending);
    // No cacheamos fallos de red para poder reintentar más tarde
    pending.then((p) => {
      if (!p) cache.delete(song.id);
    });
  }
  return pending;
}

export function searchLinks(song: Song) {
  const q = encodeURIComponent(`${song.artist} ${song.title}`);
  return {
    spotify: `https://open.spotify.com/search/${q}`,
    youtube: `https://www.youtube.com/results?search_query=${q}`,
  };
}
