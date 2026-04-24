// Free geo data sources (no API key required):
//  - REST Countries (https://restcountries.com) — list of all countries with flags & metadata
//  - Open-Meteo Geocoding (https://geocoding-api.open-meteo.com) — city search worldwide
//
// Both are free, CORS-enabled, and require no authentication.

export interface Country {
  code: string;       // ISO alpha-2
  name: string;
  flag: string;       // emoji
  region: string;
  capital?: string;
}

export interface City {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  admin1?: string;    // state/region
  latitude: number;
  longitude: number;
}

let countriesCache: Country[] | null = null;

export async function fetchCountries(): Promise<Country[]> {
  if (countriesCache) return countriesCache;
  try {
    const res = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,cca2,flag,region,capital",
    );
    if (!res.ok) throw new Error("Failed to load countries");
    const data = await res.json();
    countriesCache = (data as any[])
      .map((c) => ({
        code: c.cca2,
        name: c.name?.common ?? "",
        flag: c.flag ?? "🏳️",
        region: c.region ?? "",
        capital: c.capital?.[0],
      }))
      .filter((c) => c.name)
      .sort((a, b) => a.name.localeCompare(b.name));
    return countriesCache;
  } catch (err) {
    console.error("[geo-api] fetchCountries failed:", err);
    return [];
  }
}

/**
 * Search cities globally. Uses Open-Meteo's free geocoding API.
 * Returns up to 10 matches.
 */
export async function searchCities(query: string): Promise<City[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en&format=json`,
    );
    if (!res.ok) throw new Error("Failed to search cities");
    const data = await res.json();
    return (data.results ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      country: r.country ?? "",
      countryCode: r.country_code ?? "",
      admin1: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  } catch (err) {
    console.error("[geo-api] searchCities failed:", err);
    return [];
  }
}
