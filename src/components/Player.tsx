import { useEffect, useRef, useState } from 'react';
import { resolvePreview, type Preview } from '../audio/preview';
import type { Song } from '../game/types';

type LoadState = 'loading' | 'ready' | 'missing';

// Un único <audio> para toda la sesión: en iOS, una vez desbloqueado con un toque,
// se puede cambiar el src y reproducir sin nuevos gestos.
let sharedAudio: HTMLAudioElement | null = null;
function audioEl(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
    sharedAudio.loop = true;
  }
  return sharedAudio;
}

export function stopAudio() {
  sharedAudio?.pause();
}

/** Precarga la búsqueda de la vista previa de la siguiente canción. */
export function prefetch(song: Song | undefined) {
  if (song) void resolvePreview(song);
}

export function Player({ song, onMissing, autoPlay = true }: { song: Song; onMissing?: () => void; autoPlay?: boolean }) {
  const [state, setState] = useState<LoadState>('loading');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const preview = useRef<Preview | null>(null);

  useEffect(() => {
    let cancelled = false;
    const audio = audioEl();
    audio.pause();
    setState('loading');
    setPlaying(false);
    setProgress(0);
    resolvePreview(song).then((p) => {
      if (cancelled) return;
      preview.current = p;
      if (!p) {
        setState('missing');
        return;
      }
      audio.src = p.url;
      setState('ready');
      if (autoPlay) audio.play().catch(() => setPlaying(false));
    });
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    const onError = () => !cancelled && setState('missing');
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('error', onError);
    return () => {
      cancelled = true;
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('error', onError);
    };
  }, [song.id, autoPlay]);

  const toggle = () => {
    const audio = audioEl();
    if (audio.paused) audio.play().catch(() => undefined);
    else audio.pause();
  };

  return (
    <div className="player">
      <button
        type="button"
        className={`vinyl${playing ? ' spin' : ''}`}
        onClick={toggle}
        disabled={state !== 'ready'}
        aria-label={playing ? 'Pausar' : 'Reproducir'}
      />
      {state === 'loading' && <span className="muted">Buscando la canción…</span>}
      {state === 'ready' && (
        <>
          <div className="player-bar">
            <div style={{ width: `${progress * 100}%` }} />
          </div>
          <button type="button" className="btn sm" onClick={toggle}>
            {playing ? '❚❚ Pausar' : '▶ Reproducir'}
          </button>
        </>
      )}
      {state === 'missing' && (
        <div className="notice" style={{ textAlign: 'center' }}>
          No hemos encontrado audio para esta carta.
          {onMissing && (
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn sm" onClick={onMissing}>
                Cambiar de canción (gratis)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
