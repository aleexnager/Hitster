import type { CSSProperties } from 'react';
import type { Song } from '../game/types';

export function yearHue(year: number): number {
  const t = Math.min(1, Math.max(0, (year - 1950) / 76));
  return Math.round(330 - t * 300);
}

export function SongCard({ song, isNew }: { song: Song; isNew?: boolean }) {
  return (
    <div className={`card${isNew ? ' new' : ''}`} style={{ '--hue': yearHue(song.year) } as CSSProperties}>
      <div className="year">{song.year}</div>
      <div className="title">{song.title}</div>
      <div className="artist">{song.artist}</div>
    </div>
  );
}
