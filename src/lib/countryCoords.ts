// Rough lat/lng centroid per country code. Used for globe dots + arcs.
// Not exhaustive — falls back to 0,0 for unknown codes (which the caller
// should filter out before rendering).
export const COUNTRY_COORDS: Record<string, [number, number]> = {
  IN: [20.5937, 78.9629],
  US: [39.8283, -98.5795],
  GB: [54.0, -2.5],
  CA: [56.1304, -106.3468],
  MX: [23.6345, -102.5528],
  BR: [-14.235, -51.9253],
  AR: [-38.4161, -63.6167],
  NG: [9.082, 8.6753],
  KE: [-0.0236, 37.9062],
  ZA: [-30.5595, 22.9375],
  EG: [26.8206, 30.8025],
  MA: [31.7917, -7.0926],
  FR: [46.6034, 1.8883],
  DE: [51.1657, 10.4515],
  IT: [41.8719, 12.5674],
  ES: [40.4637, -3.7492],
  PT: [39.3999, -8.2245],
  NL: [52.1326, 5.2913],
  SE: [60.1282, 18.6435],
  NO: [60.472, 8.4689],
  FI: [61.9241, 25.7482],
  DK: [56.2639, 9.5018],
  IE: [53.4129, -8.2439],
  PL: [51.9194, 19.1451],
  CZ: [49.8175, 15.473],
  GR: [39.0742, 21.8243],
  TR: [38.9637, 35.2433],
  RU: [61.524, 105.3188],
  UA: [48.3794, 31.1656],
  IL: [31.0461, 34.8516],
  AE: [23.4241, 53.8478],
  SA: [23.8859, 45.0792],
  IR: [32.4279, 53.688],
  PK: [30.3753, 69.3451],
  BD: [23.685, 90.3563],
  LK: [7.8731, 80.7718],
  NP: [28.3949, 84.124],
  TH: [15.87, 100.9925],
  VN: [14.0583, 108.2772],
  SG: [1.3521, 103.8198],
  MY: [4.2105, 101.9758],
  ID: [-0.7893, 113.9213],
  PH: [12.8797, 121.774],
  JP: [36.2048, 138.2529],
  KR: [35.9078, 127.7669],
  CN: [35.8617, 104.1954],
  TW: [23.6978, 120.9605],
  HK: [22.3193, 114.1694],
  AU: [-25.2744, 133.7751],
  NZ: [-40.9006, 174.886],
  CO: [4.5709, -74.2973],
  PE: [-9.19, -75.0152],
  CL: [-35.6751, -71.543],
  VE: [6.4238, -66.5897],
  ZZ: [0, 0],
};

export function codeToLatLng(code: string | undefined | null): [number, number] | null {
  if (!code) return null;
  const c = code.trim().toUpperCase().slice(0, 2);
  const hit = COUNTRY_COORDS[c];
  if (!hit) return null;
  // jitter slightly so multiple stories from one country don't stack exactly
  const seed = (c.charCodeAt(0) * 31 + c.charCodeAt(1)) % 100;
  const jitter = (seed - 50) / 200; // +/- 0.25°
  return [hit[0] + jitter, hit[1] + jitter * 2];
}
