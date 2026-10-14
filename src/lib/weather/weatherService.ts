import { WeatherData } from '@/lib/types';

export interface CityCoordinates {
  name: string;
  state: string;
  country?: string;
  lat: number;
  lon: number;
}

/**
 * Curated Indian Metros, State Capitals, and Major Cultural/Fashion Hubs
 */
export const POPULAR_INDIAN_CITIES: CityCoordinates[] = [
  { name: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.385, lon: 78.4867 },
  { name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946 },
  { name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.076, lon: 72.8777 },
  { name: 'Delhi NCR', state: 'Delhi', country: 'India', lat: 28.6139, lon: 77.209 },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lon: 88.3639 },
  { name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9124, lon: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8467, lon: 80.9462 },
  { name: 'Chandigarh', state: 'Punjab/Haryana', country: 'India', lat: 30.7333, lon: 76.7794 },
  { name: 'Kochi', state: 'Kerala', country: 'India', lat: 9.9312, lon: 76.2673 },
  { name: 'Goa', state: 'Goa', country: 'India', lat: 15.2993, lon: 74.124 },
  { name: 'Indore', state: 'Madhya Pradesh', country: 'India', lat: 22.7196, lon: 75.8577 },
  { name: 'Surat', state: 'Gujarat', country: 'India', lat: 21.1702, lon: 72.8311 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', lat: 17.6868, lon: 83.2185 },
  { name: 'Nagpur', state: 'Maharashtra', country: 'India', lat: 21.1458, lon: 79.0882 },
  { name: 'Bhopal', state: 'Madhya Pradesh', country: 'India', lat: 23.2599, lon: 77.4126 },
  { name: 'Patna', state: 'Bihar', country: 'India', lat: 25.5941, lon: 85.1376 },
  { name: 'Vadodara', state: 'Gujarat', country: 'India', lat: 22.3072, lon: 73.1812 },
  { name: 'Coimbatore', state: 'Tamil Nadu', country: 'India', lat: 11.0168, lon: 76.9558 },
  { name: 'Varanasi', state: 'Uttar Pradesh', country: 'India', lat: 25.3176, lon: 82.9739 },
  { name: 'Amritsar', state: 'Punjab', country: 'India', lat: 31.634, lon: 74.8723 },
  { name: 'Noida', state: 'Uttar Pradesh', country: 'India', lat: 28.5355, lon: 77.391 },
  { name: 'Gurugram', state: 'Haryana', country: 'India', lat: 28.4595, lon: 77.0266 },
  { name: 'Dehradun', state: 'Uttarakhand', country: 'India', lat: 30.3165, lon: 78.0322 },
  { name: 'Bhubaneswar', state: 'Odisha', country: 'India', lat: 20.2961, lon: 85.8245 },
  { name: 'Mysuru', state: 'Karnataka', country: 'India', lat: 12.2958, lon: 76.6394 },
  { name: 'Thiruvananthapuram', state: 'Kerala', country: 'India', lat: 8.5241, lon: 76.9366 },
  { name: 'Agra', state: 'Uttar Pradesh', country: 'India', lat: 27.1767, lon: 78.0081 },
  { name: 'Jodhpur', state: 'Rajasthan', country: 'India', lat: 26.2389, lon: 73.0243 },
  { name: 'Raipur', state: 'Chhattisgarh', country: 'India', lat: 21.2514, lon: 81.6296 },
  { name: 'Ranchi', state: 'Jharkhand', country: 'India', lat: 23.3441, lon: 85.3096 },
  { name: 'Guwahati', state: 'Assam', country: 'India', lat: 26.1445, lon: 91.7362 },
  { name: 'Mangalore', state: 'Karnataka', country: 'India', lat: 12.9141, lon: 74.856 },
  { name: 'Warangal', state: 'Telangana', country: 'India', lat: 17.9689, lon: 79.5941 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', country: 'India', lat: 16.5062, lon: 80.648 },
  { name: 'Udaipur', state: 'Rajasthan', country: 'India', lat: 24.5854, lon: 73.7125 },
  { name: 'Srinagar', state: 'Jammu & Kashmir', country: 'India', lat: 34.0837, lon: 74.7973 },
];

// In-memory cache for dynamic geocoding queries (prevents duplicate external calls)
const geocodeCache = new Map<string, CityCoordinates>();

// In-memory cache for weather responses (15-min TTL)
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Extract clean primary token from a location string
 * e.g. "Hyderabad, Telangana, India" -> "Hyderabad"
 */
export function extractPrimaryCityName(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const commaIndex = trimmed.indexOf(',');
  if (commaIndex !== -1) {
    return trimmed.substring(0, commaIndex).trim();
  }
  return trimmed;
}

/**
 * Resolve any city name or location string into validated coordinates.
 * NEVER defaults blindly to Mumbai.
 */
export async function resolveCityCoordinates(cityName: string): Promise<CityCoordinates> {
  const clean = cityName.trim();
  const primaryToken = extractPrimaryCityName(clean);
  const cacheKey = clean.toLowerCase();

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Check local directory with exact or token matching
  const localMatch = POPULAR_INDIAN_CITIES.find(
    (c) =>
      c.name.toLowerCase() === clean.toLowerCase() ||
      c.name.toLowerCase() === primaryToken.toLowerCase() ||
      clean.toLowerCase().startsWith(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(primaryToken.toLowerCase())
  );

  if (localMatch) {
    const resolved: CityCoordinates = {
      ...localMatch,
      name: localMatch.name,
      state: localMatch.state || (clean.split(',')[1]?.trim() || ''),
      country: localMatch.country || 'India',
    };
    geocodeCache.set(cacheKey, resolved);
    return resolved;
  }

  // 2. Query Open-Meteo Geocoding API for any Indian or international city
  try {
    const queryTerm = primaryToken || clean;
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryTerm)}&count=1&language=en&format=json`;
    const res = await fetch(geoUrl, { next: { revalidate: 86400 } });

    if (res.ok) {
      const data = await res.json();
      const top = data?.results?.[0];
      if (top && typeof top.latitude === 'number' && typeof top.longitude === 'number') {
        const resolved: CityCoordinates = {
          name: top.name || primaryToken,
          state: top.admin1 || (clean.split(',')[1]?.trim() || ''),
          country: top.country || 'India',
          lat: top.latitude,
          lon: top.longitude,
        };
        geocodeCache.set(cacheKey, resolved);
        return resolved;
      }
    }
  } catch (err) {
    console.warn(`Geocoding lookup failed for "${clean}":`, err);
  }

  // 3. Fallback: Preserve the exact city name the user requested (geographic center of India as coordinate fallback)
  const fallbackCoords: CityCoordinates = {
    name: clean || 'Your Location',
    state: '',
    country: 'India',
    lat: 20.5937,
    lon: 78.9629,
  };
  geocodeCache.set(cacheKey, fallbackCoords);
  return fallbackCoords;
}

/**
 * Reverse-geocode latitude and longitude into a readable city and state.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lon: number
): Promise<{ city: string; state: string; country: string; formatted: string }> {
  // 1. Check if near any known popular city within ~0.35 degrees (~35km)
  for (const c of POPULAR_INDIAN_CITIES) {
    const dist = Math.hypot(c.lat - lat, c.lon - lon);
    if (dist < 0.35) {
      return {
        city: c.name,
        state: c.state,
        country: c.country || 'India',
        formatted: c.state ? `${c.name}, ${c.state}` : c.name,
      };
    }
  }

  // 2. Call fast client-safe reverse geocoding API
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision || 'Detected Location';
      const state = data.principalSubdivision || '';
      const country = data.countryName || 'India';
      const formatted = state && state !== city ? `${city}, ${state}` : city;
      return { city, state, country, formatted };
    }
  } catch (err) {
    console.warn('Reverse geocoding network error:', err);
  }

  // 3. Fallback coordinate representation
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return {
    city: `${latStr}, ${lonStr}`,
    state: '',
    country: 'India',
    formatted: `Location (${latStr}, ${lonStr})`,
  };
}

/**
 * Search cities for autocomplete / quick search
 */
export async function searchCities(query: string): Promise<CityCoordinates[]> {
  const q = query.trim().toLowerCase();
  if (!q) return POPULAR_INDIAN_CITIES.slice(0, 10);

  // Filter local directory first
  const localMatches = POPULAR_INDIAN_CITIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q)
  );

  if (localMatches.length >= 5) {
    return localMatches.slice(0, 8);
  }

  // Supplementary lookup from geocoding API
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      const results: any[] = data?.results || [];
      const remoteMatches: CityCoordinates[] = results.map((r) => ({
        name: r.name,
        state: r.admin1 || '',
        country: r.country || '',
        lat: r.latitude,
        lon: r.longitude,
      }));

      // Merge and deduplicate by name
      const merged = [...localMatches];
      for (const rm of remoteMatches) {
        if (!merged.some((m) => m.name.toLowerCase() === rm.name.toLowerCase())) {
          merged.push(rm);
        }
      }
      return merged.slice(0, 8);
    }
  } catch {
    // Return local matches if remote fails
  }

  return localMatches;
}

/**
 * Interpret standard WMO Weather interpretation codes
 */
export function interpretWmoCode(code: number): { condition: string; summary: string } {
  if (code === 0) return { condition: 'Clear Sky', summary: 'Clear and bright' };
  if (code >= 1 && code <= 3) return { condition: 'Partly Cloudy', summary: 'Pleasant with light cloud cover' };
  if (code >= 45 && code <= 48) return { condition: 'Foggy / Hazy', summary: 'Mild haze or mist' };
  if (code >= 51 && code <= 55) return { condition: 'Light Drizzle', summary: 'Gentle drizzle; prioritize moisture-safe fabrics' };
  if (code >= 56 && code <= 57) return { condition: 'Freezing Drizzle', summary: 'Cold drizzle' };
  if (code >= 61 && code <= 65) return { condition: 'Rain', summary: 'Rain expected; choose water-safe footwear & dark trousers' };
  if (code >= 66 && code <= 67) return { condition: 'Heavy Rain', summary: 'Sustained rain; avoid floor-length delicate garments' };
  if (code >= 71 && code <= 77) return { condition: 'Snow / Hail', summary: 'Cold precipitation' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', summary: 'Sudden rain showers possible' };
  if (code >= 85 && code <= 86) return { condition: 'Snow Showers', summary: 'Chilly snow showers' };
  if (code >= 95) return { condition: 'Thunderstorm', summary: 'Heavy rain & gusty winds; prioritize practical weatherwear' };
  return { condition: 'Pleasant', summary: 'Moderate, comfortable climate' };
}

export interface WeatherFetchOptions {
  date?: string;
  time?: string;
  lat?: number;
  lon?: number;
}

/**
 * Generate intelligent Indian climate styling guidance
 */
function generateStylingGuidance(
  temp: number,
  feelsLike: number,
  humidity: number,
  rainProb: number,
  windSpeed: number,
  uvIndex: number,
  isForecast: boolean,
  forecastTime?: string
): string {
  const isNight = forecastTime ? (Number(forecastTime.split(':')[0]) >= 18 || Number(forecastTime.split(':')[0]) <= 5) : false;

  if (rainProb >= 40) {
    return `Rain likely (${rainProb}%). Choose darker or cropped trousers, water-friendly leather/sneakers, and avoid ground-touching or white garments.`;
  }
  if (temp >= 33 || feelsLike >= 35) {
    return `${temp}°C (feels ${feelsLike}°C) with ${humidity}% humidity. High warmth — prioritize ultra-breathable linen, lightweight cottons, relaxed cuts, and light palettes.`;
  }
  if (humidity >= 75 && temp >= 28) {
    return `Muggy conditions (${humidity}% humidity at ${temp}°C). Choose open-weave cottons or linens and airy silhouettes to maintain comfort.`;
  }
  if (temp <= 19) {
    return `Cool weather (${temp}°C). Perfect for light layering with a tailored blazer, overshirt, bomber jacket, or knit sweater.`;
  }
  if (windSpeed >= 20) {
    return `Breezy conditions (${windSpeed} km/h at ${temp}°C). A structured outer layer or fitted silhouette provides effortless composure outdoors.`;
  }
  if (uvIndex >= 7 && !isNight) {
    return `Strong sunshine (UV Index ${uvIndex}). Collared shirts, breathable sleeves, and UV-protective sunglasses complement daytime outings.`;
  }

  const timingWord = isForecast ? 'Planned forecast' : 'Current conditions';
  return `${timingWord}: pleasant ${temp}°C with balanced humidity. Ideal for versatile smart-casual styling, tailored trousers, and crisp shirts.`;
}

/**
 * Fetch real-time weather or specific hourly forecast from Open-Meteo.
 * Supports exact coordinates, city names, and date/time forecasts.
 * Guaranteed: NEVER replaces an explicitly selected city with "Mumbai".
 */
export async function fetchWeatherData(
  locationInput: string | { lat: number; lon: number; name?: string; state?: string } = 'Hyderabad',
  options?: WeatherFetchOptions
): Promise<WeatherData> {
  let resolvedCity: CityCoordinates;

  if (typeof locationInput === 'object' && locationInput !== null) {
    if (typeof locationInput.lat === 'number' && typeof locationInput.lon === 'number') {
      let resolvedName = locationInput.name || '';
      let resolvedState = locationInput.state || '';
      if (!resolvedName) {
        const rev = await reverseGeocodeCoordinates(locationInput.lat, locationInput.lon);
        resolvedName = rev.formatted;
        resolvedState = rev.state;
      }
      resolvedCity = {
        name: resolvedName,
        state: resolvedState,
        country: 'India',
        lat: locationInput.lat,
        lon: locationInput.lon,
      };
    } else {
      resolvedCity = await resolveCityCoordinates(locationInput.name || 'Hyderabad');
    }
  } else {
    const rawName = String(locationInput || '').trim();
    resolvedCity = await resolveCityCoordinates(rawName || 'Hyderabad');
  }

  // Cache key incorporates location and requested date/time
  const targetDate = options?.date || new Date().toISOString().split('T')[0];
  const targetHour = options?.time ? options.time.split(':')[0] : '';
  const cacheKey = `${resolvedCity.lat.toFixed(3)}_${resolvedCity.lon.toFixed(3)}_${targetDate}_${targetHour || 'now'}`;

  const cached = weatherCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${resolvedCity.lat}&longitude=${resolvedCity.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index&timezone=auto`;

    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) throw new Error(`Open-Meteo returned status ${res.status}`);

    const data = await res.json();
    const current = data.current;

    let temp = Math.round(current?.temperature_2m ?? 28);
    let feelsLike = Math.round(current?.apparent_temperature ?? temp);
    let humidity = Math.round(current?.relative_humidity_2m ?? 50);
    let windSpeed = Math.round(current?.wind_speed_10m ?? 10);
    let rainProb = current?.precipitation > 0 ? 80 : 10;
    let uvIndex = 4;
    let weatherCode = current?.weather_code ?? 0;
    let isForecast = false;
    let forecastTimeStr: string | undefined = undefined;

    // Evaluate future / planned hourly forecast if date & time are provided
    if (options?.date && options?.time && data.hourly?.time && Array.isArray(data.hourly.time)) {
      const hourPart = options.time.padStart(5, '0').substring(0, 2);
      const targetSlot = `${options.date}T${hourPart}:00`;

      const matchIndex = data.hourly.time.findIndex(
        (t: string) => t === targetSlot || t.startsWith(`${options.date}T${hourPart}`)
      );

      if (matchIndex !== -1) {
        isForecast = true;
        forecastTimeStr = options.time;
        if (typeof data.hourly.temperature_2m?.[matchIndex] === 'number') {
          temp = Math.round(data.hourly.temperature_2m[matchIndex]);
        }
        if (typeof data.hourly.apparent_temperature?.[matchIndex] === 'number') {
          feelsLike = Math.round(data.hourly.apparent_temperature[matchIndex]);
        }
        if (typeof data.hourly.relative_humidity_2m?.[matchIndex] === 'number') {
          humidity = Math.round(data.hourly.relative_humidity_2m[matchIndex]);
        }
        if (typeof data.hourly.wind_speed_10m?.[matchIndex] === 'number') {
          windSpeed = Math.round(data.hourly.wind_speed_10m[matchIndex]);
        }
        if (typeof data.hourly.precipitation_probability?.[matchIndex] === 'number') {
          rainProb = Math.round(data.hourly.precipitation_probability[matchIndex]);
        }
        if (typeof data.hourly.uv_index?.[matchIndex] === 'number') {
          uvIndex = Math.round(data.hourly.uv_index[matchIndex]);
        }
        if (typeof data.hourly.weather_code?.[matchIndex] === 'number') {
          weatherCode = data.hourly.weather_code[matchIndex];
        }
      }
    }

    if (!isForecast && data.hourly) {
      if (Array.isArray(data.hourly.precipitation_probability) && data.hourly.precipitation_probability.length > 0) {
        rainProb = Math.round(data.hourly.precipitation_probability[0]);
      }
      if (Array.isArray(data.hourly.uv_index) && data.hourly.uv_index.length > 0) {
        uvIndex = Math.round(data.hourly.uv_index[0]);
      }
    }

    const weatherInfo = interpretWmoCode(weatherCode);
    const stylingGuidance = generateStylingGuidance(
      temp,
      feelsLike,
      humidity,
      rainProb,
      windSpeed,
      uvIndex,
      isForecast,
      options?.time
    );

    const result: WeatherData = {
      city: resolvedCity.name,
      state: resolvedCity.state || undefined,
      country: resolvedCity.country || 'India',
      latitude: resolvedCity.lat,
      longitude: resolvedCity.lon,
      temperature: temp,
      feels_like: feelsLike,
      condition: weatherInfo.condition,
      humidity,
      rain_probability: rainProb,
      wind_speed: windSpeed,
      uv_index: uvIndex,
      summary: stylingGuidance,
      is_forecast: isForecast,
      forecast_time: isForecast ? `${targetDate} ${options?.time}` : undefined,
      last_updated: new Date().toISOString(),
    };

    weatherCache.set(cacheKey, { data: result, timestamp: now });
    return result;
  } catch (error) {
    console.error(`Weather API request failed for ${resolvedCity.name}:`, error);

    // Graceful, non-destructive fallback: Preserves the user's selected location name
    const fallbackResult: WeatherData = {
      city: resolvedCity.name,
      state: resolvedCity.state || undefined,
      country: resolvedCity.country || 'India',
      latitude: resolvedCity.lat,
      longitude: resolvedCity.lon,
      temperature: 28,
      feels_like: 29,
      condition: 'Pleasant',
      humidity: 55,
      rain_probability: 10,
      wind_speed: 10,
      uv_index: 5,
      summary: `28°C with pleasant conditions in ${resolvedCity.name}. Ideal for versatile smart-casual styling, breathable cottons, and polished footwear.`,
      is_forecast: false,
      last_updated: new Date().toISOString(),
    };

    return fallbackResult;
  }
}
