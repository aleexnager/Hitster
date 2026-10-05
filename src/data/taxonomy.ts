export const GENRES: Record<string, string> = {
  pop: 'Pop',
  rock: 'Rock',
  indie: 'Indie / Alternativo',
  metal: 'Metal / Hard rock',
  punk: 'Punk',
  hiphop: 'Hip-hop / Rap',
  rnb: 'R&B / Soul / Funk',
  disco: 'Disco',
  electronica: 'Electrónica / Dance',
  latino: 'Latino (salsa, bachata, pop latino)',
  urbano: 'Urbano / Reggaeton',
  flamenco: 'Flamenco / Rumba',
  country: 'Country / Folk',
  reggae: 'Reggae / Ska',
  jazz: 'Jazz / Blues',
  kpop: 'K-pop',
};

export const COUNTRIES: Record<string, string> = {
  ES: 'España',
  US: 'Estados Unidos',
  GB: 'Reino Unido',
  IE: 'Irlanda',
  CA: 'Canadá',
  AU: 'Australia',
  MX: 'México',
  CO: 'Colombia',
  PR: 'Puerto Rico',
  AR: 'Argentina',
  CU: 'Cuba',
  CL: 'Chile',
  DO: 'Rep. Dominicana',
  VE: 'Venezuela',
  PA: 'Panamá',
  BR: 'Brasil',
  JM: 'Jamaica',
  FR: 'Francia',
  IT: 'Italia',
  DE: 'Alemania',
  AT: 'Austria',
  NL: 'Países Bajos',
  BE: 'Bélgica',
  SE: 'Suecia',
  NO: 'Noruega',
  DK: 'Dinamarca',
  FI: 'Finlandia',
  IS: 'Islandia',
  MD: 'Moldavia',
  KR: 'Corea del Sur',
};

export const COUNTRY_PRESETS: { label: string; countries: string[] }[] = [
  { label: 'Todo el mundo', countries: [] },
  { label: 'Solo España', countries: ['ES'] },
  { label: 'Hispano', countries: ['ES', 'MX', 'CO', 'PR', 'AR', 'CU', 'CL', 'DO', 'VE', 'PA'] },
  { label: 'Latinoamérica', countries: ['MX', 'CO', 'PR', 'AR', 'CU', 'CL', 'DO', 'VE', 'PA', 'BR'] },
  { label: 'Anglo', countries: ['US', 'GB', 'IE', 'CA', 'AU'] },
  { label: 'Europa', countries: ['ES', 'GB', 'IE', 'FR', 'IT', 'DE', 'AT', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'IS', 'MD'] },
];

export const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

export const TEAM_COLORS = ['#ff3d7f', '#2ec4ff', '#ffd23f', '#7cff6b', '#b46bff', '#ff8c42', '#00f5d4', '#f15bb5'];
