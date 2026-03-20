// ── countryFlags.js ──────────────────────────────────────────
// Shared flag utility — used by home carousel, header, stickerbook, open packs
// Source of truth for all country → ISO code mappings

export const COUNTRY_CODE_MAP = {
  'Algeria': 'dz',
  'Argentina': 'ar',
  'Australia': 'au',
  'Austria': 'at',
  'Belgium': 'be',
  'Bolivia': 'bo',
  'Bosnia & Herzegovina': 'ba',
  'Brazil': 'br',
  'Canada': 'ca',
  'Cape Verde': 'cv',
  'Colombia': 'co',
  'Croatia': 'hr',
  'Curaçao': 'cw',
  'Czech Republic': 'cz',
  'Denmark': 'dk',
  'DR Congo': 'cd',
  'Ecuador': 'ec',
  'Egypt': 'eg',
  'England': 'gb-eng',
  'France': 'fr',
  'Germany': 'de',
  'Ghana': 'gh',
  'Haiti': 'ht',
  'Iran': 'ir',
  'Iraq': 'iq',
  'Italy': 'it',
  'Ivory Coast': 'ci',
  'Jamaica': 'jm',
  'Japan': 'jp',
  'Jordan': 'jo',
  'Kosovo': 'xk',
  'Mexico': 'mx',
  'Morocco': 'ma',
  'Netherlands': 'nl',
  'New Caledonia': 'nc',
  'New Zealand': 'nz',
  'North Macedonia': 'mk',
  'Northern Ireland': 'gb-nir',
  'Norway': 'no',
  'Panama': 'pa',
  'Paraguay': 'py',
  'Poland': 'pl',
  'Portugal': 'pt',
  'Qatar': 'qa',
  'Republic of Ireland': 'ie',
  'Romania': 'ro',
  'Saudi Arabia': 'sa',
  'Scotland': 'gb-sct',
  'Senegal': 'sn',
  'Slovakia': 'sk',
  'South Africa': 'za',
  'South Korea': 'kr',
  'Spain': 'es',
  'Suriname': 'sr',
  'Sweden': 'se',
  'Switzerland': 'ch',
  'Tunisia': 'tn',
  'Türkiye': 'tr',
  'Ukraine': 'ua',
  'United States': 'us',
  'Uruguay': 'uy',
  'Uzbekistan': 'uz',
  'Wales': 'gb-wls',
  'Albania': 'al',
};

/**
 * Returns a 64×48 flag image URL for the given country name.
 * Used in carousels, sticker album pages, pack cards.
 */
export const getFlagUrl = (name) => {
  const code = COUNTRY_CODE_MAP[name];
  return code ? `https://flagcdn.com/64x48/${code}.png` : null;
};

/**
 * Returns a wider 80px flag image URL — used in the header logo spot.
 */
export const getFlagUrlLarge = (name) => {
  const code = COUNTRY_CODE_MAP[name];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
};

/**
 * Returns a small 24×18 flag image URL — used on pack cards.
 */
export const getFlagUrlSmall = (name) => {
  const code = COUNTRY_CODE_MAP[name];
  return code ? `https://flagcdn.com/24x18/${code}.png` : null;
};
