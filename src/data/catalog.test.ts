import { describe, expect, it } from 'vitest';
import { CATALOG, parseSongLines } from './catalog';
import { COUNTRIES, GENRES } from './taxonomy';

describe('catálogo', () => {
  it('se parsea completo y sin errores', () => {
    expect(CATALOG.length).toBeGreaterThan(500);
  });
  it('ids únicos', () => {
    const ids = CATALOG.map((s) => s.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dup).toEqual([]);
  });
  it('géneros y países válidos', () => {
    for (const s of CATALOG) {
      expect(s.genres.length, s.id).toBeGreaterThan(0);
      expect(s.countries.length, s.id).toBeGreaterThan(0);
      for (const g of s.genres) expect(GENRES, `${s.id}: ${g}`).toHaveProperty(g);
      for (const c of s.countries) expect(COUNTRIES, `${s.id}: ${c}`).toHaveProperty(c);
    }
  });
  it('años plausibles', () => {
    for (const s of CATALOG) {
      expect(s.year, s.id).toBeGreaterThanOrEqual(1950);
      expect(s.year, s.id).toBeLessThanOrEqual(2026);
    }
  });
  it('cubre todas las décadas', () => {
    for (let d = 1950; d <= 2020; d += 10) {
      expect(CATALOG.filter((s) => s.year >= d && s.year < d + 10).length, `${d}s`).toBeGreaterThan(10);
    }
  });
});

describe('importación de canciones propias', () => {
  it('parsea líneas válidas y reporta errores', () => {
    const { songs, errors } = parseSongLines('Mi canción;Mi grupo;2001;pop;ES\nmal formada\nOtra;Otro;1999', true);
    expect(songs).toHaveLength(2);
    expect(songs[0]).toMatchObject({ title: 'Mi canción', year: 2001, custom: true });
    expect(songs[1].genres).toEqual([]);
    expect(errors).toHaveLength(1);
  });
});
